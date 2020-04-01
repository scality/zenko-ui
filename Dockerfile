FROM nginx:1.16.0-alpine

COPY public/assets/js /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d

EXPOSE 8383
CMD ["nginx", "-g", "daemon off;"]
