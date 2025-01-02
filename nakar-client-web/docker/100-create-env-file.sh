#!/bin/sh

# Must be placed in nginx /docker-entrypoint.d directory

echo "BACKEND_URL=$BACKEND_URL" > /usr/share/nginx/html/.env
