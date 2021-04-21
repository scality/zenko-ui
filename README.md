# Zenko UI

[![codecov](https://codecov.io/gh/scality/zenko-ui/branch/development/1.0/graph/badge.svg?token=BRX58ZF4VJ)](https://codecov.io/gh/scality/zenko-ui)

Zenko UI is our portal to manage offline Zenko instances.

It provides a user interface for:
- Monitoring the health of the processes
- Managing storage accounts and users
- Browsing in buckets
- Managing workflows (replication, transition, expiration)
- Adding data access
- Adding storage locations
- Monitoring S3 data accesses

## How to start

### Connect to Scality VPN

The Zenko deployment runs on a VPN-accessible scality.cloud instance.

### Add entries to your local /etc/hosts file
```
NODE_IP="put-the-node-ip"

echo "127.0.0.1 ui.zenko.local" >>/etc/hosts

echo "$NODE_IP keycloak.zenko.local iam.zenko.local sts.zenko.local management.zenko.local s3.zenko.local" >>/etc/hosts
```

### Start Zenko UI locally
```
npm install
sudo npm run start:dev
```
*Note*: Regular users are not allowed to bind to port 80: ports below 1024 
require root/adminstrator rights. You must either run as root using sudo or set
up a proxy to redirect requests on port 80 to a port numbered higher than 1024.

Zenko UI now uses the metalk8s common navbar:  
```
git clone https://github.com/scality/metalk8s
cd metalk8s/shell-ui
docker build -t shell-ui .
docker run -d -p 8082:80 shell-ui
```

### Access UI
```
http://ui.zenko.local
```
must be redirected to the Keycloak login page:
```
Username or email: bartsimpson
Password: 123
```

*Note*: Keycloak uses cookies to manage user sessions. A SameSite cookie 
prevents cookies from being sent in cross-site requests, to defend against
CSRF attacks. To make the local UI work, request it using a matched domain 
(e.g., *.zenko.local).


## Test

### Run Cypress tests

#### Build and start UI
```
npm run build
docker build -t zui .
docker run -d -p 80:8383 zui
```

#### Run tests
```
CYPRESS_KEYCLOAK_ROOT="http://keycloak.zenko.local" CYPRESS_KEYCLOAK_REALM="zenko" CYPRESS_KEYCLOAK_CLIENT_ID="zenko-ui" CYPRESS_KEYCLOAK_USERNAME="bartsimpson" CYPRESS_KEYCLOAK_PASSWORD="123" CYPRESS_KEYCLOAK_USER_FULLNAME="Simpson" CYPRESS_BASE_URL="http://ui.zenko.local" npm run cypress:run
```

## Authentication
[documentation](documentation/AUTHENTICATION.md)

## Release
[documentation](documentation/RELEASE.md)
