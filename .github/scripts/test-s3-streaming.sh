#!/bin/bash

# Behavioral regression test: a >1 GiB download through the real /s3 location
# must complete when the client is slower than the upstream and the upstream
# closes stalled connections. With proxy buffering on, nginx stops reading from
# the upstream once its 1 GiB temp file limit is reached, the upstream times
# out and the download is truncated at ~1.08 GB.
#
# The /s3 block is extracted from nginx.conf.gotempl (the real config); only the
# Go-template placeholders are substituted. The control run removes the
# 'proxy_buffering off;' line (= base config) and must truncate.

set -e

cd "$(dirname "$0")/../.."

OBJECT_SIZE=1400000000
LIMIT_RATE=50M
UPSTREAM_SEND_TIMEOUT=5s
UPSTREAM_IMAGE=nginx:alpine
PROXY_TAG=$(sed -n 's/^ARG TAG=//p' Dockerfile | head -1)
PROXY_IMAGE="openresty/openresty:${PROXY_TAG:-alpine}"

SUFFIX="$$"
NETWORK="s3-streaming-test-net-$SUFFIX"
UPSTREAM_NAME="s3-streaming-upstream-$SUFFIX"
PROXY_NAME="s3-streaming-proxy-$SUFFIX"
WORKDIR=$(mktemp -d)
START_TS=$(date +%s)

cleanup() {
  docker rm -f "$PROXY_NAME" "$UPSTREAM_NAME" >/dev/null 2>&1 || true
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

echo ""
echo "=== Behavioral check: >1 GiB download through /s3 location ==="

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "❌ docker is required for the S3 streaming behavioral test but is not available"
  exit 1
fi

extract_location_block() {
  awk -v loc="$2" '
    {
      line = $0
      sub(/^[ \t]+/, "", line)
    }
    !found && line == "location " loc " {" { found = 1 }
    found {
      print
      n = gsub(/\{/, "{")
      m = gsub(/\}/, "}")
      depth += n - m
      if (depth <= 0) exit
    }
  ' "$1"
}

# Render the real template /s3 block against the test upstream. Only the
# Go-template values are substituted: the resolver (Docker's embedded DNS), the
# additional S3 rules (none) and the S3 endpoint (the test upstream).
s3_block=$(extract_location_block nginx.conf.gotempl /s3 \
  | sed -e 's/{{ *\.DNSAddress *}}/127.0.0.11/' \
        -e 's/{{ *\.AdditionalS3LocationsRules *}}//' \
        -e "s|{{ *\.S3Endpoint *}}|http://$UPSTREAM_NAME:80|")

if [ -z "$s3_block" ] || echo "$s3_block" | grep -q '{{'; then
  echo "❌ Could not render location /s3 from nginx.conf.gotempl"
  echo "$s3_block"
  exit 1
fi

if ! echo "$s3_block" | grep -q "proxy_buffering off;"; then
  echo "❌ location /s3 in nginx.conf.gotempl must contain 'proxy_buffering off;'"
  exit 1
fi

write_proxy_conf() {
  local file="$1" block="$2"
  cat > "$file" <<EOF
server {
  listen 8080;
  server_name _;
  client_max_body_size 0;

$block
}
EOF
}

write_proxy_conf "$WORKDIR/streaming.conf" "$s3_block"
write_proxy_conf "$WORKDIR/control.conf" "$(echo "$s3_block" | grep -v 'proxy_buffering off;')"

if cmp -s "$WORKDIR/streaming.conf" "$WORKDIR/control.conf"; then
  echo "❌ Control config is identical to the streaming config"
  exit 1
fi

mkdir -p "$WORKDIR/data"
cat > "$WORKDIR/upstream.conf" <<EOF
server {
  listen 80;
  root /data;
  sendfile on;
  send_timeout $UPSTREAM_SEND_TIMEOUT;
}
EOF

echo "Generating $OBJECT_SIZE byte object..."
head -c "$OBJECT_SIZE" /dev/urandom > "$WORKDIR/data/object.bin"
chmod 755 "$WORKDIR" "$WORKDIR/data"
chmod 644 "$WORKDIR/data/object.bin" "$WORKDIR/upstream.conf" "$WORKDIR/streaming.conf" "$WORKDIR/control.conf"
EXPECTED_SHA=$(sha256sum "$WORKDIR/data/object.bin" | awk '{print $1}')

docker network create "$NETWORK" >/dev/null
docker run -d --name "$UPSTREAM_NAME" --network "$NETWORK" \
  -v "$WORKDIR/upstream.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$WORKDIR/data:/data:ro" \
  "$UPSTREAM_IMAGE" >/dev/null

# Starts the proxy with the given config and downloads the object through /s3.
# Sets DOWNLOAD_SIZE, DOWNLOAD_SHA and CURL_EXIT.
download_through_proxy() {
  local conf="$1" port tries=0
  docker rm -f "$PROXY_NAME" >/dev/null 2>&1 || true
  docker run -d --name "$PROXY_NAME" --network "$NETWORK" -p 127.0.0.1::8080 \
    -v "$conf:/etc/nginx/conf.d/default.conf:ro" \
    "$PROXY_IMAGE" >/dev/null
  port=$(docker port "$PROXY_NAME" 8080/tcp | head -1 | sed 's/.*://')

  until curl -fsI -o /dev/null "http://127.0.0.1:$port/s3/object.bin"; do
    tries=$((tries + 1))
    if [ "$tries" -ge 30 ]; then
      echo "❌ Proxy did not become ready"
      docker logs "$PROXY_NAME" 2>&1 | tail -20
      docker logs "$UPSTREAM_NAME" 2>&1 | tail -20
      exit 1
    fi
    sleep 1
  done

  rm -f "$WORKDIR/download.bin"
  set +e
  curl -sS --limit-rate "$LIMIT_RATE" --max-time 170 \
    -o "$WORKDIR/download.bin" "http://127.0.0.1:$port/s3/object.bin"
  CURL_EXIT=$?
  set -e
  DOWNLOAD_SIZE=$(stat -c %s "$WORKDIR/download.bin" 2>/dev/null || echo 0)
  DOWNLOAD_SHA=$(sha256sum "$WORKDIR/download.bin" | awk '{print $1}')
  rm -f "$WORKDIR/download.bin"
  docker rm -f "$PROXY_NAME" >/dev/null 2>&1 || true
}

echo "Streaming run (real /s3 block, client limited to $LIMIT_RATE/s)..."
download_through_proxy "$WORKDIR/streaming.conf"
echo "Streaming run: curl exit=$CURL_EXIT, received $DOWNLOAD_SIZE of $OBJECT_SIZE bytes"
if [ "$CURL_EXIT" -eq 0 ] && [ "$DOWNLOAD_SIZE" -eq "$OBJECT_SIZE" ] && [ "$DOWNLOAD_SHA" = "$EXPECTED_SHA" ]; then
  echo "✅ Streaming run passed: full $DOWNLOAD_SIZE bytes delivered with matching sha256"
else
  echo "❌ Streaming run failed: expected $OBJECT_SIZE bytes with sha256 $EXPECTED_SHA, got $DOWNLOAD_SIZE bytes (curl exit $CURL_EXIT, sha256 $DOWNLOAD_SHA)"
  exit 1
fi

echo "Control run (same block without 'proxy_buffering off;' = base config)..."
download_through_proxy "$WORKDIR/control.conf"
echo "Control run: curl exit=$CURL_EXIT, received $DOWNLOAD_SIZE of $OBJECT_SIZE bytes"
if [ "$CURL_EXIT" -eq 18 ] || [ "$DOWNLOAD_SIZE" -lt "$OBJECT_SIZE" ]; then
  echo "✅ Control run passed: buffered proxy truncated the download at $DOWNLOAD_SIZE bytes (curl exit $CURL_EXIT)"
else
  echo "❌ Control run failed: the download was NOT truncated without 'proxy_buffering off;' - the harness no longer reproduces the bug"
  exit 1
fi

echo "✅ S3 streaming behavioral test passed in $(( $(date +%s) - START_TS ))s"
