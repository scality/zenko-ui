ARG TAG=1.29.2.4-alpine-fat

FROM openresty/openresty:${TAG}

EXPOSE 8383

COPY conf/scality-cloud-nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/*

COPY ./build/ /usr/share/nginx/html/
RUN rm -rf /usr/share/nginx/html/index.html

# Copy scripts
COPY deploy-script.sh /usr/local/bin/deploy-script.sh
COPY startup.sh /startup.sh
RUN chmod +x /usr/local/bin/deploy-script.sh /startup.sh

# Install jq for JSON parsing in deploy-script.sh
RUN apk add --no-cache jq

CMD ["/startup.sh"]
