FROM jboss/keycloak:10.0.2

COPY keycloak-realm.json /config/keycloak-realm.json
CMD ['-b 0.0.0.0 -Dkeycloak.migration.action=import -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/config/keycloak-realm.json']
