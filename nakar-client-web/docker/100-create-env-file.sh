#!/bin/sh

echo "BACKEND_URL=$BACKEND_URL" >> /usr/share/nginx/html/.env
cat /usr/share/nginx/html/.env