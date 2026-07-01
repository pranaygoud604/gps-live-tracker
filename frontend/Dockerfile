FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_APP_NAME
ARG VITE_COMPANY_NAME
ARG VITE_TILE_URL
ARG VITE_TILE_ATTRIBUTION

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_COMPANY_NAME=$VITE_COMPANY_NAME
ENV VITE_TILE_URL=$VITE_TILE_URL
ENV VITE_TILE_ATTRIBUTION=$VITE_TILE_ATTRIBUTION

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.25-alpine

RUN apk add --no-cache curl

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
