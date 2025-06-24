#!/bin/bash

set -e

CONFIG_DIR="/usr/share/nginx/html/.well-known/configs"
NGINX_CONFIG="/etc/nginx/conf.d/default.conf"
TEMP_CONFIG="/tmp/nginx_temp.conf"

echo "Fetching all configs from $CONFIG_DIR..."

# Use associative array as Set to prevent duplicates
declare -A CONFIG_SET
declare -A PROXY_LOCATIONS_SET

# Get all config files and add to set
if [ -d "$CONFIG_DIR" ]; then
  while IFS= read -r -d '' config_file; do
    CONFIG_SET["$config_file"]=1
  done < <(find "$CONFIG_DIR" -type f -print0 2>/dev/null)
fi

if [ ${#CONFIG_SET[@]} -eq 0 ]; then
  echo "No config files found in $CONFIG_DIR"
  exit 1
fi

echo "Found ${#CONFIG_SET[@]} unique config files"

# Check if any config has proxy settings
HAS_PROXY_CONFIG=false
for config_file in "${!CONFIG_SET[@]}"; do
  if jq -e '.spec.selfConfiguration.proxy' "$config_file" >/dev/null 2>&1; then
    HAS_PROXY_CONFIG=true
    break
  fi
done

# If no proxy configurations found, skip
if [ "$HAS_PROXY_CONFIG" = false ]; then
  echo "No proxy configurations found, skipping nginx update"
  exit 0
fi

echo "Generating nginx configuration..."

# Read existing nginx config and prepare for modification
cp "$NGINX_CONFIG" "$TEMP_CONFIG"

# Find the position to insert proxy locations (before the closing brace)
# Remove the last closing brace temporarily
sed -i '$d' "$TEMP_CONFIG"

# Process each config file and add proxy locations
for config_file in "${!CONFIG_SET[@]}"; do
  if jq -e '.spec.selfConfiguration.proxy' "$config_file" >/dev/null 2>&1; then
    echo "Processing proxy config from: $config_file"

    # Extract proxy configurations and collect unique ones
    while IFS='|' read -r service source target; do
      if [ ! -z "$service" ] && [ ! -z "$source" ] && [ ! -z "$target" ]; then
        echo "Found proxy: $service $source -> $target"
        # Use source path as key to prevent duplicates
        PROXY_LOCATIONS_SET["$source"]="$service|$target"
      fi
    done < <(jq -r '.spec.selfConfiguration.proxy | to_entries[] | "\(.key)|\(.value.source)|\(.value.target)"' "$config_file" 2>/dev/null)
  fi
done

# Add collected proxy configurations
if [ ${#PROXY_LOCATIONS_SET[@]} -gt 0 ]; then
  echo "" >>"$TEMP_CONFIG"
  echo "    # Dynamic proxy configurations" >>"$TEMP_CONFIG"

  for source_path in "${!PROXY_LOCATIONS_SET[@]}"; do
    IFS='|' read -r service target <<<"${PROXY_LOCATIONS_SET[$source_path]}"
    echo "Adding proxy: $source_path -> $target"

    # Generate simple proxy configuration
    cat >>"$TEMP_CONFIG" <<EOF

    location $source_path {
        proxy_pass $target;
    }
EOF
  done
fi

# Close server block
echo "}" >>"$TEMP_CONFIG"

echo "Generated integrated nginx configuration:"
cat "$TEMP_CONFIG"

# Replace the original config with the updated one
cp "$TEMP_CONFIG" "$NGINX_CONFIG"

# Reload nginx directly (skip test due to DNS resolution issues)
echo "Reloading nginx..."
nginx -s reload

echo "Nginx configuration updated and reloaded successfully"

# Cleanup temp file
rm -f "$TEMP_CONFIG"