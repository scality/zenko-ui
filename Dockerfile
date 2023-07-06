ARG NGINX_IMAGE_VERSION=1.23.3-alpine

FROM nginx:${NGINX_IMAGE_VERSION}

EXPOSE 8383

COPY conf/scality-cloud-nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/*

COPY ./build/ /usr/share/nginx/html/
RUN rm -rf /usr/share/nginx/html/index.html

CMD ["nginx", "-g", "daemon off;"]
