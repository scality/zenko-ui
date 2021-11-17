ARG OPENRESTY_IMAGE_VERSION=1.19.9.1-2-centos7

FROM openresty/openresty:${OPENRESTY_IMAGE_VERSION}

EXPOSE 8383

COPY conf/scality-cloud-nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/*

COPY public/assets/ /usr/share/nginx/html/

CMD ["nginx", "-g", "daemon off;"]
