FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./
COPY .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

EXPOSE 80

COPY conf/scality-cloud-nginx.conf /etc/nginx/conf.d/default.conf

RUN apk add --no-cache jq bash
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/build/ /usr/share/nginx/html/
COPY public/assets/data/.well-known /usr/share/nginx/html/.well-known

RUN rm -rf /usr/share/nginx/html/index.html

COPY deploy-script.sh /usr/local/bin/deploy-script.sh
RUN chmod +x /usr/local/bin/deploy-script.sh

CMD ["/bin/bash", "-c", "/usr/local/bin/deploy-script.sh; nginx -g 'daemon off;'"]

