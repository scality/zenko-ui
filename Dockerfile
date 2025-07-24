ARG TAG=1.27.1.1-alpine-fat

FROM openresty/openresty:${TAG}

EXPOSE 8383

COPY conf/scality-cloud-nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/*

COPY ./build/ /usr/share/nginx/html/
RUN rm -rf /usr/share/nginx/html/index.html

# Copy deploy script
COPY deploy-script.sh /usr/local/bin/deploy-script.sh
RUN chmod +x /usr/local/bin/deploy-script.sh

# Install jq for JSON parsing in deploy-script.sh
RUN apk add --no-cache jq

# Start the container with integrated startup logic
CMD ["/bin/sh", "-c", "echo 'Starting Zenko UI container...' && \
echo 'Running deploy script to configure nginx...' && \
(if /usr/local/bin/deploy-script.sh; then \
    echo 'Deploy script completed successfully'; \
else \
    echo 'Deploy script failed or no configurations found, continuing with default nginx config...'; \
fi) && \
echo 'Starting nginx...' && \
exec nginx -g 'daemon off;'"]
