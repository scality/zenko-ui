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
  echo "Adding dynamic proxy configurations to server block..."

  # Create a temporary file with proxy configurations
  PROXY_TEMP="/tmp/proxy_locations.conf"
  cat > "$PROXY_TEMP" << 'EOF'

    # Dynamic proxy configurations
EOF

  for source_path in "${!PROXY_LOCATIONS_SET[@]}"; do
    IFS='|' read -r service target <<<"${PROXY_LOCATIONS_SET[$source_path]}"
    echo "Adding proxy: $source_path -> $target"

    # Generate proxy configuration
    cat >> "$PROXY_TEMP" << EOF

    location $source_path {
        proxy_pass $target;
    }
EOF
  done

  # Use awk to insert proxy configurations before the last closing brace of the server block
  awk '
  BEGIN { 
    in_server = 0
    server_brace_count = 0
    found_server = 0
  }
  
  # Detect start of server block
  /server.*{/ {
    in_server = 1
    server_brace_count = 1
    found_server = 1
    print
    next
  }
  
  # Track braces when inside server block
  in_server == 1 {
    # Count opening braces
    line_copy = $0
    brace_opens = gsub(/{/, "", line_copy)
    server_brace_count += brace_opens
    
    # Count closing braces
    line_copy = $0
    brace_closes = gsub(/}/, "", line_copy)
    server_brace_count -= brace_closes
    
    # If this line closes the server block, insert proxy configs before it
    if (server_brace_count == 0 && /}/) {
      # Insert proxy configurations
      while ((getline proxy_line < "'$PROXY_TEMP'") > 0) {
        print proxy_line
      }
      close("'$PROXY_TEMP'")
      in_server = 0
    }
  }
  
  # Print all lines
  { print }
  
  END {
    if (found_server == 0) {
      print "Warning: No server block found in nginx config" > "/dev/stderr"
    }
  }
  ' "$TEMP_CONFIG" > "${TEMP_CONFIG}.new"

  # Replace the original temp config
  mv "${TEMP_CONFIG}.new" "$TEMP_CONFIG"
  
  # Clean up proxy temp file
  rm -f "$PROXY_TEMP"
fi

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