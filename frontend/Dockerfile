# frontend/Dockerfile
# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app

ENV CI=true
COPY package*.json ./
# if you use pnpm or yarn, change next lines
RUN npm ci --silent

COPY . .
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# nginx default conf is generally fine for SPAs, but we add fallback to index.html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
