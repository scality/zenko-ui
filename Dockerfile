ARG NGINX_IMAGE_VERSION=1.15.8

FROM nginx:${NGINX_IMAGE_VERSION}

EXPOSE 8383

COPY conf/scality-cloud-nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/*

COPY public/assets/ /usr/share/nginx/html/

CMD ["nginx", "-g", "daemon off;"]
