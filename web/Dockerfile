# Stage 1: build the React app. VITE_API_URL is baked in at build time.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:3333
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: serve the static files with nginx, like most companies do.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
