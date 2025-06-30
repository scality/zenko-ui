#!/bin/bash

set -e

echo "Testing deploy-script.sh functionality..."

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

# Run the actual deploy script (but catch nginx reload error)
if sudo timeout 10 bash deploy-script.sh 2>&1 | grep -E "(Adding proxy|Processing proxy config)" > /dev/null; then
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
  cat /etc/nginx/conf.d/default.conf
  exit 1
fi

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

# Run the actual deploy script but catch nginx reload error
if sudo timeout 10 bash deploy-script.sh 2>&1 | grep -E "(Adding proxy|Processing proxy config)" > /dev/null; then
  echo "✅ Test 2 passed: Script processes configs with multiple server blocks"
else
  echo "❌ Test 2 failed: Script should handle multiple server blocks"
  exit 1
fi

# Verify the proxy was added to a server block (not just appended to the end)
if grep -A5 -B5 "location /health" /etc/nginx/conf.d/default.conf | grep -q "server {"; then
  echo "✅ Test 2 passed: Proxy location correctly inserted inside server block"
else
  echo "❌ Test 2 failed: Proxy location not properly inserted in server block"
  cat /etc/nginx/conf.d/default.conf
  exit 1
fi

echo "=== Test 3: No config files ==="
sudo rm -f /usr/share/nginx/html/.well-known/configs/*.json

if sudo bash deploy-script.sh 2>&1 | grep -q "No config files found"; then
  echo "✅ Test 3 passed: Handles no config files"
else
  echo "❌ Test 3 failed: Should exit when no config files found"
  exit 1
fi

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

if sudo bash deploy-script.sh 2>&1 | grep -q "No proxy configurations found"; then
  echo "✅ Test 4 passed: Handles no proxy configurations"
else
  echo "❌ Test 4 failed: Should skip when no proxy configurations found"
  exit 1
fi

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
if sudo timeout 10 bash deploy-script.sh 2>&1 | grep -E "(Adding proxy|Processing proxy config)" > /dev/null; then
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
  cat /etc/nginx/conf.d/default.conf
  exit 1
fi

echo "=== All tests passed! ===" 