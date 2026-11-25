#!/bin/bash

# Behavioral regression test: a >1 GiB download through the /s3 location must
# complete when the client is slower than the upstream and the upstream closes
# stalled connections. With proxy buffering on, nginx stops reading from the
# upstream once its 1 GiB temp file limit is reached, the upstream times out
# and the download is truncated at ~1.08 GB.
#
# The proxy is the zenko-ui image built from the repo Dockerfile (without UI
# assets). At startup, deploy-script.sh runs in production mode and generates
# /s3 from a selfConfiguration.proxy.s3 entry, as on ARTESCA. The control run
# uses the same script with an empty S3_STREAMING_DIRECTIVES (= base config)
# and must truncate.

set -e

cd "$(dirname "$0")/../.."

OBJECT_SIZE=1400000000
TEMP_FILE_CAP=1073741824
LIMIT_RATE=50M
UPSTREAM_SEND_TIMEOUT=5s
UPSTREAM_IMAGE=nginx:alpine

SUFFIX="$$"
NETWORK="s3-streaming-test-net-$SUFFIX"
UPSTREAM_NAME="s3-streaming-upstream-$SUFFIX"
PROXY_NAME="s3-streaming-proxy-$SUFFIX"
PROXY_IMAGE="zenko-ui-s3-streaming-test:$SUFFIX"
WORKDIR=$(mktemp -d)
START_TS=$(date +%s)

cleanup() {
  docker rm -f "$PROXY_NAME" "$UPSTREAM_NAME" >/dev/null 2>&1 || true
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
  docker rmi -f "$PROXY_IMAGE" >/dev/null 2>&1 || true
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

sha256() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

echo ""
echo "=== Behavioral check: >1 GiB download through the generated /s3 location ==="

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "❌ docker is required for the S3 streaming behavioral test but is not available"
  exit 1
fi

mkdir -p "$WORKDIR/context/build" "$WORKDIR/context/conf" "$WORKDIR/configs" "$WORKDIR/data"
cp Dockerfile deploy-script.sh startup.sh "$WORKDIR/context/"
cp conf/scality-cloud-nginx.conf "$WORKDIR/context/conf/"

cat > "$WORKDIR/configs/zenko-ui.json" <<EOF
{
  "spec": {
    "selfConfiguration": {
      "proxy": {
        "s3": { "source": "/s3", "target": "http://$UPSTREAM_NAME:80" }
      }
    }
  }
}
EOF

cat > "$WORKDIR/upstream.conf" <<EOF
server {
  listen 80;
  root /data;
  sendfile on;
  send_timeout $UPSTREAM_SEND_TIMEOUT;
}
EOF

echo "Building proxy image from Dockerfile..."
docker build -q -t "$PROXY_IMAGE" "$WORKDIR/context" >/dev/null

echo "Generating $OBJECT_SIZE byte object..."
head -c "$OBJECT_SIZE" /dev/urandom > "$WORKDIR/data/object.bin"
chmod 755 "$WORKDIR" "$WORKDIR/data" "$WORKDIR/configs"
chmod 644 "$WORKDIR/data/object.bin" "$WORKDIR/upstream.conf" "$WORKDIR/configs/zenko-ui.json"
EXPECTED_SHA=$(sha256 "$WORKDIR/data/object.bin")

docker network create "$NETWORK" >/dev/null
docker run -d --name "$UPSTREAM_NAME" --network "$NETWORK" \
  -v "$WORKDIR/upstream.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$WORKDIR/data:/data:ro" \
  "$UPSTREAM_IMAGE" >/dev/null

# Starts the proxy (optionally with another deploy-script.sh) and downloads the
# object through /s3. Sets DOWNLOAD_SIZE, DOWNLOAD_SHA and CURL_EXIT.
# coredns.kube-system.svc, the resolver in the production /s3 block, is mapped
# to Docker's embedded DNS so the upstream name resolves.
download_through_proxy() {
  local script="$1" port tries=0
  local script_mount=()
  [ -n "$script" ] && script_mount=(-v "$script:/usr/local/bin/deploy-script.sh:ro")
  docker rm -f "$PROXY_NAME" >/dev/null 2>&1 || true
  docker run -d --name "$PROXY_NAME" --network "$NETWORK" -p 127.0.0.1::80 \
    --add-host coredns.kube-system.svc:127.0.0.11 \
    -v "$WORKDIR/configs:/usr/share/nginx/html/.well-known/configs:ro" \
    "${script_mount[@]}" \
    "$PROXY_IMAGE" >/dev/null
  port=$(docker port "$PROXY_NAME" 80/tcp | head -1 | sed 's/.*://')

  until curl -fsI -o /dev/null "http://127.0.0.1:$port/s3/object.bin"; do
    tries=$((tries + 1))
    if [ "$tries" -ge 30 ]; then
      echo "❌ Proxy did not become ready"
      docker logs "$PROXY_NAME" 2>&1 | tail -40
      docker logs "$UPSTREAM_NAME" 2>&1 | tail -20
      exit 1
    fi
    sleep 1
  done

  if ! docker logs "$PROXY_NAME" 2>&1 | grep -q "Nginx configuration is valid"; then
    echo "❌ deploy-script.sh did not produce a valid production config"
    docker logs "$PROXY_NAME" 2>&1 | tail -40
    exit 1
  fi
  docker exec "$PROXY_NAME" nginx -T 2>/dev/null | awk '/location \/s3 \{/,/^    \}/'

  rm -f "$WORKDIR/download.bin"
  set +e
  curl -sS --limit-rate "$LIMIT_RATE" --max-time 170 \
    -o "$WORKDIR/download.bin" "http://127.0.0.1:$port/s3/object.bin"
  CURL_EXIT=$?
  set -e
  DOWNLOAD_SIZE=$(wc -c < "$WORKDIR/download.bin" 2>/dev/null | tr -d ' ' || echo 0)
  DOWNLOAD_SHA=$(sha256 "$WORKDIR/download.bin")
  rm -f "$WORKDIR/download.bin"
  docker rm -f "$PROXY_NAME" >/dev/null 2>&1 || true
}

echo "Streaming run (deploy-script.sh as committed, client limited to $LIMIT_RATE/s)..."
download_through_proxy ""
echo "Streaming run: curl exit=$CURL_EXIT, received $DOWNLOAD_SIZE of $OBJECT_SIZE bytes"
if [ "$CURL_EXIT" -eq 0 ] && [ "$DOWNLOAD_SIZE" -eq "$OBJECT_SIZE" ] && [ "$DOWNLOAD_SHA" = "$EXPECTED_SHA" ]; then
  echo "✅ Streaming run passed: full $DOWNLOAD_SIZE bytes delivered with matching sha256"
else
  echo "❌ Streaming run failed: expected $OBJECT_SIZE bytes with sha256 $EXPECTED_SHA, got $DOWNLOAD_SIZE bytes (curl exit $CURL_EXIT, sha256 $DOWNLOAD_SHA)"
  exit 1
fi

sed 's/^\( *S3_STREAMING_DIRECTIVES=\).*/\1""/' deploy-script.sh > "$WORKDIR/control-deploy-script.sh"
if cmp -s deploy-script.sh "$WORKDIR/control-deploy-script.sh"; then
  echo "❌ Could not build the control deploy-script.sh: S3_STREAMING_DIRECTIVES assignment not found"
  exit 1
fi
chmod 755 "$WORKDIR/control-deploy-script.sh"

echo "Control run (empty S3_STREAMING_DIRECTIVES = base config)..."
download_through_proxy "$WORKDIR/control-deploy-script.sh"
echo "Control run: curl exit=$CURL_EXIT, received $DOWNLOAD_SIZE of $OBJECT_SIZE bytes"
if [ "$CURL_EXIT" -ne 0 ] && [ "$DOWNLOAD_SIZE" -ge "$TEMP_FILE_CAP" ] && [ "$DOWNLOAD_SIZE" -lt "$OBJECT_SIZE" ]; then
  echo "✅ Control run passed: buffered proxy truncated the download after the 1 GiB temp file cap, at $DOWNLOAD_SIZE bytes (curl exit $CURL_EXIT)"
else
  echo "❌ Control run failed: expected truncation between $TEMP_FILE_CAP and $OBJECT_SIZE bytes - the harness no longer reproduces the bug"
  exit 1
fi

echo "✅ S3 streaming behavioral test passed in $(( $(date +%s) - START_TS ))s"
