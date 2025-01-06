FROM node:22 AS builder
WORKDIR /app

COPY nakar-server/config ./config
COPY nakar-server/database ./database
COPY nakar-server/public ./public
COPY nakar-server/src ./src
COPY nakar-server/test ./test
COPY nakar-server/types ./types
COPY nakar-server/babel.config.js ./
COPY nakar-server/eslint.config.mjs ./
COPY nakar-server/package.json ./
COPY nakar-server/package-lock.json ./
COPY nakar-server/tsconfig.configs.json ./
COPY nakar-server/tsconfig.json ./
COPY nakar-server/openapi-gen.yaml ./

RUN npm install && npm run build:gen && npm run build


FROM node:22
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./
COPY nakar-server/public ./public
COPY nakar-server/package.json ./
COPY nakar-server/package-lock.json ./
COPY nakar-server/favicon.ico ./
RUN npm ci --production
EXPOSE 1337

CMD ["npm", "start"]
