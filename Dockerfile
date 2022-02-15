# Build stage
FROM node:14.19-alpine AS builder
RUN apk --no-cache add git

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build:prod

# Runtime stage
FROM nginx

COPY --from=builder /app/dist /usr/share/nginx/html
