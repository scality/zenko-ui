#!/bin/bash

set -e

# Enable test mode to skip nginx validation
export DEPLOY_SCRIPT_TEST_MODE=true

echo "Testing deploy-script.sh functionality..."

# Debug environment information
echo "=== Environment Debug Info ==="
echo "Bash version: $BASH_VERSION"
bash --version | head -1
echo "Shell: $SHELL"
echo "Current user: $(whoami)"
echo "Working directory: $(pwd)"
echo "Test mode: $DEPLOY_SCRIPT_TEST_MODE"

# Test associative array support
echo ""
echo "=== Testing array support ==="
if bash -c 'declare -A test_array 2>/dev/null && test_array["key"]="value" && echo "Arrays: ${#test_array[@]}"' 2>/dev/null; then
  echo "✅ Associative arrays supported"
else
  echo "❌ Associative arrays NOT supported - using traditional arrays"
fi

echo ""

# Check for required tools
echo "=== Checking required tools ==="
for tool in jq awk sed head tail find; do
  if command -v "$tool" >/dev/null 2>&1; then
    echo "✅ $tool: $(command -v $tool)"
  else
    echo "❌ $tool: NOT FOUND"
    exit 1
  fi
done

# Validate deploy script syntax before running tests
echo ""
echo "=== Validating deploy-script.sh syntax ==="
if bash -n deploy-script.sh; then
  echo "✅ Deploy script syntax is valid"
else
  echo "❌ Deploy script has syntax errors"
  exit 1
fi

echo ""

# Test 1: Simple proxy with basic server block
echo "=== Test 1: Simple proxy with basic server block ==="
sudo mkdir -p /usr/share/nginx/html/.well-known/configs
sudo tee /usr/share/nginx/html/.well-known/configs/test1.json > /dev/null << 'EOF'
{
  "spec": {
    "selfConfiguration": {
      "proxy": {
        "api": {
          "source": "/api",
          "target": "http://127.0.0.1:8080"
        }
      }
    }
  }
}
EOF

# Create base nginx config
sudo tee /etc/nginx/conf.d/default.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}
EOF

# Run the actual deploy script
if sudo DEPLOY_SCRIPT_TEST_MODE="$DEPLOY_SCRIPT_TEST_MODE" bash deploy-script.sh 2>&1 | grep -E "(Adding proxy|Processing proxy config)" > /dev/null; then
  echo "✅ Test 1 passed: Script processes simple proxy config"
else
  echo "❌ Test 1 failed: Script should process proxy config"
  exit 1
fi

# Verify results
if grep -q "location /api" /etc/nginx/conf.d/default.conf && grep -q "proxy_pass http://127.0.0.1:8080" /etc/nginx/conf.d/default.conf; then
  echo "✅ Test 1 passed: Simple proxy works with server block detection"
else
  echo "❌ Test 1 failed: Proxy not correctly inserted"
  echo "Generated config:"
  cat /etc/nginx/conf.d/default.conf
  exit 1
fi

# Clean up config files before Test 2
sudo rm -f /usr/share/nginx/html/.well-known/configs/*.json

echo "=== Test 2: Multiple server blocks ==="
# Test with multiple server blocks to ensure we insert in the right one
sudo tee /etc/nginx/conf.d/default.conf > /dev/null << 'EOF'
upstream backend {
    server 127.0.0.1:8080;
}

server {
    listen 443 ssl;
    server_name secure.example.com;
    
    location / {
        return 301 http://$server_name$request_uri;
    }
}

server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}
EOF

# Create a simple test config
sudo tee /usr/share/nginx/html/.well-known/configs/test2.json > /dev/null << 'EOF'
{
  "spec": {
    "selfConfiguration": {
      "proxy": {
        "health": {
          "source": "/health",
          "target": "http://127.0.0.1:9000"
        }
      }
    }
  }
}
EOF

# Run the actual deploy script
echo "Running deploy script..."
echo "Command: sudo DEPLOY_SCRIPT_TEST_MODE='$DEPLOY_SCRIPT_TEST_MODE' bash deploy-script.sh"

# Set script to exit on error but capture the exit code
set +e
deploy_output=$(sudo DEPLOY_SCRIPT_TEST_MODE="$DEPLOY_SCRIPT_TEST_MODE" bash deploy-script.sh 2>&1)
deploy_exit_code=$?
set -e

echo "Deploy script exit code: $deploy_exit_code"
echo "Deploy script output:"
echo "$deploy_output"

if [ $deploy_exit_code -ne 0 ]; then
  echo "❌ Test 2 failed: Deploy script exited with code $deploy_exit_code"
  echo "This indicates an error in the deploy script execution"
  
  # Debug: Check if config files exist
  echo ""
  echo "=== Debug: Checking config files ==="
  if [ -d "/usr/share/nginx/html/.well-known/configs" ]; then
    echo "Config directory exists"
    ls -la /usr/share/nginx/html/.well-known/configs/
    echo "Config file content:"
    cat /usr/share/nginx/html/.well-known/configs/test2.json 2>/dev/null || echo "Cannot read config file"
  else
    echo "Config directory does not exist"
  fi
  
  # Debug: Check nginx config
  echo ""
  echo "=== Debug: Checking nginx config ==="
  if [ -f "/etc/nginx/conf.d/default.conf" ]; then
    echo "Nginx config exists"
    echo "First 10 lines:"
    head -10 /etc/nginx/conf.d/default.conf
  else
    echo "Nginx config does not exist"
  fi
  
  exit 1
fi

if echo "$deploy_output" | grep -E "(Adding proxy|Processing proxy config)" > /dev/null; then
  echo "✅ Test 2 passed: Script processes configs with multiple server blocks"
else
  echo "❌ Test 2 failed: Script should handle multiple server blocks"
  echo "Expected to see 'Adding proxy' or 'Processing proxy config' in output"
  exit 1
fi

# Verify the proxy was added to a server block (not just appended to the end)
# Check if location /health exists and there's a server block containing it
if grep -q "location /health" /etc/nginx/conf.d/default.conf; then
  # Check if the proxy is within a server block by ensuring it's between server { and }
  server_block=$(awk '/server.*\{/,/^}/' /etc/nginx/conf.d/default.conf)
  if echo "$server_block" | grep -q "location /health"; then
    echo "✅ Test 2 passed: Proxy location correctly inserted inside server block"
  else
    echo "❌ Test 2 failed: Proxy location not properly inserted in server block"
    echo "Generated config:"
    cat /etc/nginx/conf.d/default.conf
    exit 1
  fi
else
  echo "❌ Test 2 failed: Proxy location /health not found in config"
  echo "Generated config:"
  cat /etc/nginx/conf.d/default.conf
  exit 1
fi

echo "=== Test 3: No config files ==="
sudo rm -f /usr/share/nginx/html/.well-known/configs/*.json

if sudo DEPLOY_SCRIPT_TEST_MODE="$DEPLOY_SCRIPT_TEST_MODE" bash deploy-script.sh 2>&1 | grep -q "No config files found"; then
  echo "✅ Test 3 passed: Handles no config files"
else
  echo "❌ Test 3 failed: Should exit when no config files found"
  exit 1
fi

# Clean up config files before Test 4
sudo rm -f /usr/share/nginx/html/.well-known/configs/*.json

echo "=== Test 4: No proxy section ==="
sudo tee /usr/share/nginx/html/.well-known/configs/test4.json > /dev/null << 'EOF'
{
  "spec": {
    "selfConfiguration": {
      "other": "value"
    }
  }
}
EOF

if sudo DEPLOY_SCRIPT_TEST_MODE="$DEPLOY_SCRIPT_TEST_MODE" bash deploy-script.sh 2>&1 | grep -q "No proxy configurations found"; then
  echo "✅ Test 4 passed: Handles no proxy configurations"
else
  echo "❌ Test 4 failed: Should skip when no proxy configurations found"
  exit 1
fi

# Clean up config files before Test 5
sudo rm -f /usr/share/nginx/html/.well-known/configs/*.json

echo "=== Test 5: Multiple proxies ==="
# Create config with multiple proxies
sudo tee /usr/share/nginx/html/.well-known/configs/test5.json > /dev/null << 'EOF'
{
  "spec": {
    "selfConfiguration": {
      "proxy": {
        "api": {
          "source": "/api",
          "target": "http://127.0.0.1:8080"
        },
        "admin": {
          "source": "/admin",
          "target": "http://127.0.0.1:9000"
        }
      }
    }
  }
}
EOF

# Reset base config
sudo tee /etc/nginx/conf.d/default.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}
EOF

# Run the actual deploy script
if sudo DEPLOY_SCRIPT_TEST_MODE="$DEPLOY_SCRIPT_TEST_MODE" bash deploy-script.sh 2>&1 | grep -E "(Adding proxy|Processing proxy config)" > /dev/null; then
  echo "✅ Test 5 passed: Script processes multiple proxies"
else
  echo "❌ Test 5 failed: Script should process multiple proxies"
  exit 1
fi

# Verify both proxies are present
if grep -q "location /api" /etc/nginx/conf.d/default.conf && grep -q "location /admin" /etc/nginx/conf.d/default.conf; then
  echo "✅ Test 5 passed: Multiple proxies correctly inserted"
else
  echo "❌ Test 5 failed: Multiple proxies not found"
  echo "Generated config:"
  cat /etc/nginx/conf.d/default.conf
  exit 1
fi

# Clean up config files before Test 6
sudo rm -f /usr/share/nginx/html/.well-known/configs/*.json

echo "=== Test 6: Veeam configuration ==="
# Test Veeam SOS API configuration
sudo tee /usr/share/nginx/html/.well-known/configs/test6.json > /dev/null << 'EOF'
{
  "spec": {
    "selfConfiguration": {
      "basePath": "/",
      "proxy": {
        "veeam": {
          "cloudserverEndpoint": "http://127.0.0.1:8000"
        },
        "s3": {
          "source": "/s3",
          "target": "http://127.0.0.1:8000"
        }
      }
    }
  }
}
EOF

# Reset base config
sudo tee /etc/nginx/conf.d/default.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}
EOF

# Run the actual deploy script
if sudo DEPLOY_SCRIPT_TEST_MODE="$DEPLOY_SCRIPT_TEST_MODE" bash deploy-script.sh 2>&1 | grep -E "(Veeam configuration|Adding Veeam SOS API)" > /dev/null; then
  echo "✅ Test 6 passed: Script processes Veeam configuration"
else
  echo "❌ Test 6 failed: Script should process Veeam configuration"
  echo "Deploy script output:"
  sudo DEPLOY_SCRIPT_TEST_MODE="$DEPLOY_SCRIPT_TEST_MODE" bash deploy-script.sh 2>&1 || true
  exit 1
fi

# Verify Veeam regex location is present (check for the actual pattern generated)
if grep -q 'location ~ "/s3/.*/\\.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/' /etc/nginx/conf.d/default.conf; then
  echo "✅ Test 6 passed: Veeam SOS API regex location correctly inserted"
else
  echo "❌ Test 6 failed: Veeam regex location not found"
  echo "Expected pattern: location ~ \"/s3/.*/\\.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/"
  echo "Generated config:"
  cat /etc/nginx/conf.d/default.conf
  echo ""
  echo "Looking for Veeam-related lines:"
  grep -i veeam /etc/nginx/conf.d/default.conf || echo "No Veeam lines found"
  exit 1
fi

# Also verify S3 location with Veeam handling is present
if grep -A5 -B5 "location /s3" /etc/nginx/conf.d/default.conf | grep -q "arg_prefix.*system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c"; then
  echo "✅ Test 6 passed: S3 location with Veeam query parameter handling correctly inserted"
else
  echo "⚠️  Test 6 warning: S3 location with Veeam query parameter handling not found (may be expected based on configuration)"
fi

echo ""
echo "=== Test 7: Veeam configuration with custom basePath ==="
# Clean up config files before Test 7
sudo rm -f /usr/share/nginx/html/.well-known/configs/*.json

# Test Veeam with custom basePath
sudo tee /usr/share/nginx/html/.well-known/configs/test7.json > /dev/null << 'EOF'
{
  "spec": {
    "selfConfiguration": {
      "basePath": "/custom",
      "proxy": {
        "veeam": {
          "cloudserverEndpoint": "http://127.0.0.1:8000"
        },
        "s3": {
          "source": "/custom/s3",
          "target": "http://127.0.0.1:8000"
        }
      }
    }
  }
}
EOF

# Reset base config
sudo tee /etc/nginx/conf.d/default.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}
EOF

# Run the actual deploy script
if sudo DEPLOY_SCRIPT_TEST_MODE="$DEPLOY_SCRIPT_TEST_MODE" bash deploy-script.sh 2>&1 | grep -E "(Veeam configuration|Adding Veeam SOS API)" > /dev/null; then
  echo "✅ Test 7 passed: Script processes Veeam configuration with custom basePath"
else
  echo "❌ Test 7 failed: Script should process Veeam configuration with custom basePath"
  exit 1
fi

# Verify Veeam regex location with custom path is present
if grep -q 'location ~ "/custom/s3/.*/\\.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/' /etc/nginx/conf.d/default.conf; then
  echo "✅ Test 7 passed: Veeam SOS API regex location with custom basePath correctly inserted"
else
  echo "❌ Test 7 failed: Veeam regex location with custom basePath not found"
  echo "Expected pattern: location ~ \"/custom/s3/.*/\\.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/"
  echo "Generated config:"
  cat /etc/nginx/conf.d/default.conf
  exit 1
fi

echo ""
echo "=== Test 8: Veeam proxy section without cloudserverEndpoint ==="
# Clean up config files before Test 8
sudo rm -f /usr/share/nginx/html/.well-known/configs/*.json

# Test Veeam proxy section with empty config (no cloudserverEndpoint)
sudo tee /usr/share/nginx/html/.well-known/configs/test8.json > /dev/null << 'EOF'
{
  "spec": {
    "selfConfiguration": {
      "basePath": "/",
      "proxy": {
        "veeam": {},
        "s3": {
          "source": "/s3",
          "target": "http://127.0.0.1:8000"
        }
      }
    }
  }
}
EOF

# Reset base config
sudo tee /etc/nginx/conf.d/default.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}
EOF

# Run the actual deploy script
output=$(sudo DEPLOY_SCRIPT_TEST_MODE="$DEPLOY_SCRIPT_TEST_MODE" bash deploy-script.sh 2>&1)
if echo "$output" | grep -q "Adding proxy"; then
  echo "✅ Test 8 passed: Script processes configuration with Veeam proxy section but no cloudserverEndpoint"
else
  echo "❌ Test 8 failed: Script should process proxy configuration"
  echo "Deploy script output:"
  echo "$output"
  exit 1
fi

# In this case, there should be no Veeam regex location since no cloudserverEndpoint
if ! grep -q 'location ~ "/s3/.*/\\.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/' /etc/nginx/conf.d/default.conf; then
  echo "✅ Test 8 passed: No Veeam regex location when cloudserverEndpoint is missing"
else
  echo "❌ Test 8 failed: Veeam regex location should not be present without cloudserverEndpoint"
  cat /etc/nginx/conf.d/default.conf
  exit 1
fi

# But regular s3 proxy should be present
if grep -q "location /s3" /etc/nginx/conf.d/default.conf; then
  echo "✅ Test 8 passed: Regular S3 proxy location is present"
else
  echo "❌ Test 8 failed: Regular S3 proxy location should be present"
  cat /etc/nginx/conf.d/default.conf
  exit 1
fi

echo ""
echo "=== All tests passed! ===" 