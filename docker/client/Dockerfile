# Build stage
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY SchoolERPSMSClient/package.json SchoolERPSMSClient/package-lock.json ./
RUN npm ci \
    && npx --yes update-browserslist-db@latest
COPY SchoolERPSMSClient/ ./
RUN npm run build

# Serve stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
