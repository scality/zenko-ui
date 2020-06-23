docker run -p 8080:8080 -e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin -e KEYCLOAK_IMPORT=/tmp/keycloak.json -v $(pwd)/keycloak.json:/tmp/keycloak.json jboss/keycloak
./standalone.sh -Dkeycloak.migration.action=export -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.usersExportStrategy=REALM_FILE -Dkeycloak.migration.file=keycloak-export.json -Djboss.socket.binding.port-offset=100
./opt/jboss/keycloak/bin/standalone.sh -Djboss.socket.binding.port-offset=100 -Dkeycloak.migration.action=import -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/tmp/keycloak-export.json
./kcadm.sh config credentials --server http://localhost:8080/auth --realm master --user admin --password admin
./kcadm.sh create realms -s realm=myrealm2 -s enabled=true -o
./kcadm.sh create users -r myrealm2 -s username=nicolas2bert2 -s enabled=true
./kcadm.sh set-password -r myrealm2 --username nicolas2bert2 --new-password 123
./kcadm.sh create clients -r myrealm2 -s clientId=myclient2 -s 'redirectUris=["http://127.0.0.1:8383/*"]' -i


docker run  -p 8080:8080 -v $(pwd)/keycloak-realm.json:/tmp/keycloak-realm.json -it jboss/keycloak /bin/sh ./opt/jboss/keycloak/bin/standalone.sh -Djboss.socket.binding.port-offset=100 -Dkeycloak.migration.action=import -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/tmp/keycloak-realm.json


docker run  -p 8080:8080 -v $(pwd)/keycloak-realm.json:/tmp/keycloak-realm.json jboss/keycloak -Dkeycloak.migration.action=import -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/tmp/keycloak-realm.json


docker run -v $(pwd)/keycloak-realm.json:/tmp/keycloak-realm.json jboss/keycloak -Dkeycloak.migration.action=import -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/tmp/keycloak-realm.json
