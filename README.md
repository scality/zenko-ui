# Zenko UI

[![codecov](https://codecov.io/gh/scality/zenko-ui/branch/development/1.0/graph/badge.svg?token=BRX58ZF4VJ)](https://codecov.io/gh/scality/zenko-ui)

Zenko UI is our portal to manage offline Zenko instances.

It provides a User Interface to
- Monitor the health of the processes
- Manage storage accounts and users
- Browse into buckets
- Manage workflows (replication, transition, expiration)
- Add a data access
- Add a storage location
- Have informations about S3 data access

## How to start

### Connect to Scality VPN

Zenko deployment runs on scality.cloud instance accessible through VPN.

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
*Note*: Regular users are not allowed to bind to port 80, ports below 1024 require root/adminstrator rights.
You will need to either run as root using sudo, or setup a proxy that redirects requests on port 80 to a port over 1024.

### Access UI
```
http://ui.zenko.local
```
Should be redirected to Keycloak login page:
```
Username or email: bartsimpson
Password: 123
```

*Note*: Keycloak uses cookies to manage user session.
SameSite cookie prevents the cookies from being sent in cross-site requests, to defend against CSRF attacks.
So, to make our local UI work, we need to request it using a matched domain (ie *.zenko.local).


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
