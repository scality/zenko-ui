#!/bin/bash

# set -e stops the execution of a script if a command or pipeline has an error
set -e

# modifying keycloak-realm.json
JQ_FILTERS_REALM="."

if [[ "$KEYCLOAK_REALM" ]] ; then
    JQ_FILTERS_REALM="$JQ_FILTERS_REALM | .realm=\"$KEYCLOAK_REALM\""
fi

if [[ "$KEYCLOAK_CLIENT_ID" ]] ; then
    JQ_FILTERS_REALM="$JQ_FILTERS_REALM | .clients[0].clientId=\"$KEYCLOAK_CLIENT_ID\""
fi

if [[ "$KEYCLOAK_USERNAME" ]] ; then
    JQ_FILTERS_REALM="$JQ_FILTERS_REALM | .users[0].username=\"$KEYCLOAK_USERNAME\""
fi

if [[ "$KEYCLOAK_USER_FIRSTNAME" ]] ; then
    JQ_FILTERS_REALM="$JQ_FILTERS_REALM | .users[0].firstName=\"$KEYCLOAK_USER_FIRSTNAME\""
fi

if [[ "$KEYCLOAK_USER_LASTNAME" ]] ; then
    JQ_FILTERS_REALM="$JQ_FILTERS_REALM | .users[0].lastName=\"$KEYCLOAK_USER_LASTNAME\""
fi

if [[ "$KEYCLOAK_USER_INSTANCE_ID" ]] ; then
    JQ_FILTERS_REALM="$JQ_FILTERS_REALM | .users[0].attributes.instanceIds[0]=\"$KEYCLOAK_USER_INSTANCE_ID\""
fi

if [[ $JQ_FILTERS_REALM != "." ]]; then
    jq "$JQ_FILTERS_REALM" keycloak-realm.json > keycloak-realm.json.tmp
    mv keycloak-realm.json.tmp keycloak-realm.json
fi

# LAUNCH keycloak entrypoint
/opt/jboss/tools/docker-entrypoint.sh $@
