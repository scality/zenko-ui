 #!/bin/bash

set -e

CONFIG_DIR="/usr/share/nginx/html/.well-known/configs"
NGINX_CONFIG="/etc/nginx/conf.d/default.conf"
TEMP_CONFIG="/tmp/nginx_temp.conf"

echo "Fetching all configs from $CONFIG_DIR..."

# Use traditional arrays for bash 3.2 compatibility
CONFIG_FILES=()
PROXY_SOURCES=()
PROXY_TARGETS=()

# Get all config files
if [ -d "$CONFIG_DIR" ]; then
  while IFS= read -r -d '' config_file; do
    CONFIG_FILES+=("$config_file")
  done < <(find "$CONFIG_DIR" -type f -print0 2>/dev/null)
fi

if [ ${#CONFIG_FILES[@]} -eq 0 ]; then
  echo "No config files found in $CONFIG_DIR"
  exit 1
fi

echo "Found ${#CONFIG_FILES[@]} config files"

# List found config files
for config_file in "${CONFIG_FILES[@]}"; do
  echo "  - $config_file"
done

# Check if any config has proxy settings and Veeam settings
HAS_PROXY_CONFIG=false
HAS_VEEAM_CONFIG=false
VEEAM_CONFIG=""

for config_file in "${CONFIG_FILES[@]}"; do
  if jq -e '.spec.selfConfiguration.proxy' "$config_file" >/dev/null 2>&1; then
    HAS_PROXY_CONFIG=true
    
    # Check for Veeam configuration
    if jq -e '.spec.selfConfiguration.proxy.veeam' "$config_file" >/dev/null 2>&1; then
      cloudserver_endpoint=$(jq -r '.spec.selfConfiguration.proxy.veeam.cloudserverEndpoint // ""' "$config_file")
      
      # Veeam is enabled if: cloudserverEndpoint exists
      if [ ! -z "$cloudserver_endpoint" ] && [ "$cloudserver_endpoint" != "null" ]; then
        HAS_VEEAM_CONFIG=true
        base_path=$(jq -r '.spec.selfConfiguration.basePath // "/"' "$config_file")
        
        if [ ! -z "$cloudserver_endpoint" ] && [ "$cloudserver_endpoint" != "null" ]; then
          # Store Veeam configuration
          VEEAM_CONFIG="$base_path|$cloudserver_endpoint"
          echo "Found Veeam configuration: basePath=$base_path, endpoint=$cloudserver_endpoint"
        fi
      fi
    fi
  fi
done

# If no proxy configurations found, skip
if [ "$HAS_PROXY_CONFIG" = false ]; then
  echo "No proxy configurations found, skipping nginx update"
  exit 0
fi

echo "Generating nginx configuration..."

# Create backup of original nginx config
cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup"

# Read existing nginx config and prepare for modification
cp "$NGINX_CONFIG" "$TEMP_CONFIG"

# Function to check if a proxy already exists
proxy_exists() {
  local source="$1"
  local i
  for i in "${!PROXY_SOURCES[@]}"; do
    if [ "${PROXY_SOURCES[$i]}" = "$source" ]; then
      return 0
    fi
  done
  return 1
}

# Process each config file and add proxy locations
for config_file in "${CONFIG_FILES[@]}"; do
  if jq -e '.spec.selfConfiguration.proxy' "$config_file" >/dev/null 2>&1; then
    echo "Processing proxy config from: $config_file"

    # Extract proxy configurations and collect unique ones (excluding veeam)
    while IFS='|' read -r service source target; do
      if [ ! -z "$service" ] && [ ! -z "$source" ] && [ ! -z "$target" ] && [ "$service" != "veeam" ]; then
        echo "Found proxy: $service $source -> $target"
        
        # Skip backend proxy if it conflicts with existing static location
        if [ "$service" = "backend" ]; then
          if grep -q "location $source" "$NGINX_CONFIG" 2>/dev/null; then
            echo "Skipping backend proxy $source (conflicts with existing static location)"
            continue
          fi
        fi
        
        # Add to arrays if not already present (prevent duplicates)
        if ! proxy_exists "$source"; then
          PROXY_SOURCES+=("$source")
          PROXY_TARGETS+=("$target")
        fi
      fi
    done < <(jq -r '.spec.selfConfiguration.proxy | to_entries[] | "\(.key)|\(.value.source)|\(.value.target)"' "$config_file" 2>/dev/null)
  fi
done

# Add collected proxy configurations
if [ ${#PROXY_SOURCES[@]} -gt 0 ] || [ "$HAS_VEEAM_CONFIG" = true ]; then
  echo "Adding dynamic proxy configurations to server block..."

  # Create a temporary file with proxy configurations
  PROXY_TEMP="/tmp/proxy_locations.conf"
  cat > "$PROXY_TEMP" << 'EOF'

    # ===========================================
    # Dynamic proxy configurations
    # ===========================================
EOF

  # Add Veeam configurations first (they need higher priority)
  if [ "$HAS_VEEAM_CONFIG" = true ] && [ ! -z "$VEEAM_CONFIG" ]; then
    IFS='|' read -r base_path cloudserver_endpoint <<<"$VEEAM_CONFIG"
    
    # Construct s3 path based on base path
    if [ "$base_path" = "/" ]; then
      s3_path="/s3"
    else
      s3_path="${base_path}/s3"
    fi
    
    echo "Adding Veeam SOS API configuration for path: $s3_path"
    
    # Add Veeam regex location block (test mode uses simplified pattern)
    if [ "${DEPLOY_SCRIPT_TEST_MODE:-false}" = "true" ]; then
      # Simplified pattern for testing
      cat >> "$PROXY_TEMP" << EOF

    # Veeam SOS API support (test mode)
    location ~ "${s3_path}/(.*)/\\.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/(system\\.xml|capacity\\.xml).*?" {
        set \$escaped_proxied_path \$1;
        rewrite "${s3_path}/(.*)/\\.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/(.*)" /_/veeam/\$1/.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/\$2 break;
        proxy_pass ${cloudserver_endpoint};
        proxy_redirect off;
    }
EOF
    else
      # Production pattern with S3-compliant bucket name validation
      cat >> "$PROXY_TEMP" << EOF

    # Veeam SOS API support with S3-compliant bucket name validation
    location ~ "${s3_path}/([a-z0-9][a-z0-9-.]{1,61}[a-z0-9])/\\.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/(system\\.xml|capacity\\.xml).*?" {
        set \$escaped_proxied_path \$1;
        rewrite "${s3_path}/([a-z0-9][a-z0-9-.]{1,61}[a-z0-9])/\\.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/(.*)" /_/veeam/\$1/.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/\$2 break;
        proxy_pass ${cloudserver_endpoint};
        proxy_redirect off;
    }
EOF
    fi
  fi

  # Sort proxy locations for better organization
  # Create arrays for different types of proxies (store indices)
  ROOT_PROXY_INDICES=()
  DATA_PROXY_INDICES=()
  S3_PROXY_INDICES=()
  
  # Categorize proxy locations (S3 paths get priority)
  for i in "${!PROXY_SOURCES[@]}"; do
    source_path="${PROXY_SOURCES[$i]}"
    if [[ "$source_path" == *"/s3" ]] || [[ "$source_path" == "/s3" ]]; then
      S3_PROXY_INDICES+=("$i")
    elif [[ "$source_path" == "/data/"* ]]; then
      DATA_PROXY_INDICES+=("$i")
    else
      ROOT_PROXY_INDICES+=("$i")
    fi
  done
  
  # Function to generate proxy headers based on service type
  generate_proxy_headers() {
    local source_path="$1"
    local headers=""
    
    # Add special headers for specific services (based on production environment)
    case "$source_path" in
      "/sts"|"*/sts")
        headers="        proxy_set_header   host \$host;
        proxy_set_header   proxy_path $source_path;"
        ;;
      "/utilization"|"*/utilization")
        headers="        proxy_set_header   host \$host;
        proxy_set_header   proxy_path $source_path;"
        ;;
    esac
    
    echo "$headers"
  }

  # Add proxy configurations in organized order
  
  # 1. Root path proxies (except S3)
  if [ ${#ROOT_PROXY_INDICES[@]} -gt 0 ]; then
    echo "    # Root path proxies" >> "$PROXY_TEMP"
    for i in "${ROOT_PROXY_INDICES[@]}"; do
      source_path="${PROXY_SOURCES[$i]}"
      target="${PROXY_TARGETS[$i]}"
      echo "Adding proxy: $source_path -> $target"
      
      # Generate any special headers for this service
      proxy_headers=$(generate_proxy_headers "$source_path")
      
      cat >> "$PROXY_TEMP" << EOF

    location $source_path {
        proxy_pass $target;
$([ ! -z "$proxy_headers" ] && echo "$proxy_headers")
    }
EOF
    done
  fi
  
  # 2. Data path proxies (except S3)
  if [ ${#DATA_PROXY_INDICES[@]} -gt 0 ]; then
    echo "" >> "$PROXY_TEMP"
    echo "    # Data path proxies" >> "$PROXY_TEMP"
    for i in "${DATA_PROXY_INDICES[@]}"; do
      source_path="${PROXY_SOURCES[$i]}"
      target="${PROXY_TARGETS[$i]}"
      echo "Adding proxy: $source_path -> $target"
      
      # Generate any special headers for this service
      proxy_headers=$(generate_proxy_headers "$source_path")
      
      # Extract the path after /data for proper rewriting
      # For example: /data/api -> /api/
      data_subpath="${source_path#/data}"
      # Ensure the target has trailing slash if data_subpath is not empty
      if [ ! -z "$data_subpath" ] && [ "$data_subpath" != "/" ]; then
        # Remove trailing slash from target if it exists, then add the subpath with trailing slash
        target_clean="${target%/}"
        proxy_target="${target_clean}${data_subpath}/"
      else
        proxy_target="$target"
      fi
      
      cat >> "$PROXY_TEMP" << EOF

    location $source_path {
        proxy_pass $proxy_target;
$([ ! -z "$proxy_headers" ] && echo "$proxy_headers")
    }
EOF
    done
  fi
  
  # 3. S3 proxies (with special Veeam handling)
  if [ ${#S3_PROXY_INDICES[@]} -gt 0 ]; then
    echo "" >> "$PROXY_TEMP"
    echo "    # S3 proxies" >> "$PROXY_TEMP"
    for i in "${S3_PROXY_INDICES[@]}"; do
      source_path="${PROXY_SOURCES[$i]}"
      target="${PROXY_TARGETS[$i]}"
      echo "Adding proxy: $source_path -> $target"
      
      # Check if this is an S3 proxy and we have Veeam enabled
      if [ "$HAS_VEEAM_CONFIG" = true ] && [ ! -z "$VEEAM_CONFIG" ]; then
        IFS='|' read -r base_path cloudserver_endpoint <<<"$VEEAM_CONFIG"
        
        # S3 location with Veeam handling (test mode uses simplified config)
        if [ "${DEPLOY_SCRIPT_TEST_MODE:-false}" = "true" ]; then
          # Simplified configuration for testing
          cat >> "$PROXY_TEMP" << EOF

    location $source_path {
        # Veeam SOS API: Handle special prefix parameter
        if ( \$arg_prefix = ".system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c%2F" ) {
            proxy_pass ${cloudserver_endpoint};
            rewrite "${source_path}/(.*)" /_/veeam/\$1 break;
        }
        # Standard S3 requests
        proxy_pass $target;
    }
EOF
        else
          # Full production configuration with advanced features
          cat >> "$PROXY_TEMP" << EOF

    location $source_path {
        # Veeam SOS API: Handle special prefix parameter
        if ( \$arg_prefix = ".system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c%2F" ) {
            proxy_pass ${cloudserver_endpoint};
            rewrite "${source_path}/(.*)" /_/veeam/\$1 break;
        }
        
        # URL encoding handling for plus signs in S3 requests
        set_by_lua_block \$urlencore_proxy_uri {
            local uri = ngx.var.request_uri
            local proxy_uri = ngx.re.gsub(uri, "^${source_path}", "")
            local encoded_uri = ngx.re.gsub(proxy_uri, "\\\\+", "%2B", "jo")
            return encoded_uri
        }
        
        # Standard S3 requests with URL encoding
        proxy_pass ${target}\$urlencore_proxy_uri;
        proxy_redirect off;
    }
EOF
        fi
      else
        # Regular S3 proxy without Veeam (test mode uses simplified config)
        if [ "${DEPLOY_SCRIPT_TEST_MODE:-false}" = "true" ]; then
          # Simplified configuration for testing
          cat >> "$PROXY_TEMP" << EOF

    location $source_path {
        proxy_pass $target;
    }
EOF
        else
          # Full production configuration with advanced features
          cat >> "$PROXY_TEMP" << EOF

    location $source_path {
        # URL encoding handling for plus signs in S3 requests
        set_by_lua_block \$urlencore_proxy_uri {
            local uri = ngx.var.request_uri
            local proxy_uri = ngx.re.gsub(uri, "^${source_path}", "")
            local encoded_uri = ngx.re.gsub(proxy_uri, "\\\\+", "%2B", "jo")
            return encoded_uri
        }
        
        # Standard S3 requests with URL encoding
        proxy_pass ${target}\$urlencore_proxy_uri;
        proxy_redirect off;
    }
EOF
        fi
      fi
    done
  fi

  # Add closing comment
  cat >> "$PROXY_TEMP" << 'EOF'

    # ===========================================
    # End of dynamic proxy configurations
    # ===========================================
EOF

  # Find the correct server block to insert proxy configurations using awk
  # We want to insert into a server block that handles HTTP traffic (port 80)
  
  # Use awk to find the line number where we should insert proxy config
  INSERT_LINE=$(awk '
    BEGIN { 
      in_server = 0; 
      brace_count = 0; 
      target_line = 0; 
      has_listen_80 = 0; 
      server_end = 0; 
      last_server_end = 0;
    }
    
      # Track server block start
  /server *\{/ { 
    in_server = 1; 
    brace_count = 1; 
    has_listen_80 = 0; 
    next; 
  }
    
    # If in server block
    in_server {
          # Count braces
    brace_count += gsub(/\{/, "") - gsub(/\}/, "");
      
      # Check for listen 80
      if (/listen +80/ || (/listen.*80/ && !/ssl/)) {
        has_listen_80 = 1;
      }
      
      # Server block ends when brace_count reaches 0
      if (brace_count == 0) {
        server_end = NR;
        last_server_end = NR;
        
        # If this server listens on port 80, use it
        if (has_listen_80) {
          target_line = NR;
        }
        
        in_server = 0;
      }
    }
    
    END { 
      # If no port 80 server found, use the last server block
      if (target_line == 0 && last_server_end > 0) {
        target_line = last_server_end;
      }
      print target_line; 
    }
  ' "$TEMP_CONFIG")
  
  if [ "$INSERT_LINE" -gt 0 ]; then
    # Insert proxy config before the closing brace of the target server
    head -n $((INSERT_LINE - 1)) "$TEMP_CONFIG" > "${TEMP_CONFIG}.new"
    cat "$PROXY_TEMP" >> "${TEMP_CONFIG}.new"
    tail -n +$INSERT_LINE "$TEMP_CONFIG" >> "${TEMP_CONFIG}.new"
  else
    # Fallback: append to end of file
    sed '$d' "$TEMP_CONFIG" > "${TEMP_CONFIG}.new"
    cat "$PROXY_TEMP" >> "${TEMP_CONFIG}.new"
    echo "}" >> "${TEMP_CONFIG}.new"
  fi

  # Replace the original temp config
  mv "${TEMP_CONFIG}.new" "$TEMP_CONFIG"
  
  # Clean up proxy temp file
  rm -f "$PROXY_TEMP"
fi

echo "Generated integrated nginx configuration:"
cat "$TEMP_CONFIG"

# Replace the original config with the updated one
cp "$TEMP_CONFIG" "$NGINX_CONFIG"

# Validate the complete nginx configuration
echo "Validating nginx configuration..."
echo "Current nginx config:"
cat "$NGINX_CONFIG"

# Check if we're in test mode (skip validation for testing)
if [ "${DEPLOY_SCRIPT_TEST_MODE:-false}" = "true" ]; then
  echo "⚠️  Test mode enabled, skipping nginx validation"
  echo "✅ Nginx configuration updated successfully (test mode)"
  rm -f "${NGINX_CONFIG}.backup"
elif nginx_output=$(nginx -t 2>&1); then
  echo "✅ Nginx configuration is valid"
  
  # Reload nginx (try graceful reload first, then force if needed)
  echo "Reloading nginx..."
  if pgrep nginx >/dev/null 2>&1; then
    if nginx -s reload 2>/dev/null; then
      echo "✅ Nginx reloaded successfully"
    else
      echo "⚠️  Nginx reload failed, but config is valid"
    fi
  else
    echo "⚠️  Nginx is not running, config will be used when nginx starts"
    echo "This is normal for container startup or testing environment"
  fi
  
  echo "✅ Nginx configuration updated successfully"
  
  # Clean up backup file on success
  rm -f "${NGINX_CONFIG}.backup"
else
  echo "❌ Generated nginx configuration is invalid!"
  echo "Nginx validation output:"
  echo "$nginx_output"
  echo "Configuration validation failed. Reverting to backup."
  
  # Restore original config if we have a backup
  if [ -f "${NGINX_CONFIG}.backup" ]; then
    cp "${NGINX_CONFIG}.backup" "$NGINX_CONFIG"
    echo "Original configuration restored"
  fi
  
  echo "Invalid config that was generated:"
  cat "$TEMP_CONFIG"
  exit 1
fi

# Cleanup temp file
rm -f "$TEMP_CONFIG" 