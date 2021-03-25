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

Zenko deployment runs on scality.cloud instance (10.200.2.233) accessible through VPN.

### Add entries to your local /etc/hosts file
```
10.200.2.233 keycloak.zenko.local
10.200.2.233 management.zenko.local
10.200.2.233 ui.zenko.local
10.200.2.233 s3.zenko.local
```

### Start Zenko UI locally
```
npm install
npm run start:dev
```

### Access UI
```
http://127.0.0.1:8383
```
Should be redirected to Keycloak login page:
```
Username or email: bartsimpson
Password: 123
```


## Test

### Run Cypress tests

#### Build and start UI
```
npm run build
docker build -t zui .
docker run -d -p 8383:8383 zui
```

#### Run tests
```
CYPRESS_KEYCLOAK_ROOT="http://keycloak.zenko.local" CYPRESS_KEYCLOAK_REALM="zenko" CYPRESS_KEYCLOAK_CLIENT_ID="zenko-ui" CYPRESS_KEYCLOAK_USERNAME="bartsimpson" CYPRESS_KEYCLOAK_PASSWORD="123" CYPRESS_KEYCLOAK_USER_FULLNAME="Simpson"  npm run cypress:run
```

## Authentication
[documentation](documentation/AUTHENTICATION.md)

## Release
[documentation](documentation/RELEASE.md)
