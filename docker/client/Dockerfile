# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY SchoolERPSMSClient/package*.json ./
RUN npm ci

# Copy source files
COPY SchoolERPSMSClient/. .

# Build arguments for environment variables
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration for client
COPY docker/client/nginx-client.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (will be handled by main nginx reverse proxy)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

