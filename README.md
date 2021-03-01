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

```
npm install
npm run start:dev
```

## Test

### Run Cypress tests
```
CYPRESS_KEYCLOAK_ROOT="http://127.0.0.1:8080" CYPRESS_KEYCLOAK_REALM="myrealm" CYPRESS_KEYCLOAK_CLIENT_ID="myclient" CYPRESS_KEYCLOAK_USERNAME="bartsimpson" CYPRESS_KEYCLOAK_PASSWORD="123" CYPRESS_KEYCLOAK_USER_FIRSTNAME="Bart" CYPRESS_KEYCLOAK_USER_LASTNAME="Simpson" CYPRESS_KEYCLOAK_USER_FULLNAME="Bart Simpson"  npm run cypress:run
```

## Authentication
[documentation](documentation/AUTHENTICATION.md)

## Release
[documentation](documentation/RELEASE.md)
