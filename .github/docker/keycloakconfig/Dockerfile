FROM jboss/keycloak:10.0.2

EXPOSE 8080

USER root

# install jq
RUN microdnf install wget
RUN wget -O jq https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64
RUN chmod +x ./jq
RUN cp jq /usr/bin

COPY keycloak-realm.json /config/keycloak-realm.json
COPY entrypoint.sh /

WORKDIR /config

ENTRYPOINT ["/entrypoint.sh"]

CMD ["-b 0.0.0.0 -Dkeycloak.migration.action=import -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/config/keycloak-realm.json"]
