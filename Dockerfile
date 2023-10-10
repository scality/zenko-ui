ARG TAG=1.21.4.2-1-alpine-fat

FROM openresty/openresty:${TAG}

EXPOSE 8383

COPY conf/scality-cloud-nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/*

COPY ./build/ /usr/share/nginx/html/
RUN rm -rf /usr/share/nginx/html/index.html

CMD ["nginx", "-g", "daemon off;"]
