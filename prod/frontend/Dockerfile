# Build stage
FROM node:20 AS build
WORKDIR /app
COPY SchoolERPSMSClient/package*.json ./
RUN npm install
COPY SchoolERPSMSClient/. .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY prod/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
