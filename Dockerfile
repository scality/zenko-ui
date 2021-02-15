ARG NGINX_IMAGE_VERSION=1.15.8
ARG NODE_IMAGE_VERSION=10.19.0-slim

FROM node:${NODE_IMAGE_VERSION} as build-deps
WORKDIR /urs/src/app
COPY package*.json ./
RUN npm install
COPY ./ .
RUN npm build

FROM nginx:${NGINX_IMAGE_VERSION} as production-stage
EXPOSE 8383
COPY conf/zenko-ui-nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*
COPY public/assets/ /usr/share/nginx/html/
CMD ["nginx", "-g", "daemon off;"]
