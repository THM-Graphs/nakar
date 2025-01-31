#!/bin/sh

echo "BACKEND_URL=$BACKEND_URL" >> /usr/share/nginx/html/.env
echo "BACKEND_SOCKET_URL=$BACKEND_SOCKET_URL" >> /usr/share/nginx/html/.env
cat /usr/share/nginx/html/.env