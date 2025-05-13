FROM node:22 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY config ./config
COPY database ./database
COPY public ./public
COPY src ./src
COPY src-gen ./src-gen
COPY types ./types
COPY babel.config.js ./
COPY tsconfig.json ./

RUN npm run build

FROM node:22
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./
COPY public ./public
COPY favicon.ico package.json package-lock.json ./
RUN npm ci --omit=dev

EXPOSE 80
EXPOSE 81

HEALTHCHECK \
    --interval=10m \
    --timeout=5s \
    --start-period=120s \
    --start-interval=5s \
    CMD curl -f http://localhost/_health || exit 1

CMD ["npm", "start"]
