# ---- Build stage ----
FROM node:18-bullseye AS build
WORKDIR /app

# Copy the whole frontend (node_modules/build excluded via .dockerignore).
# We intentionally do NOT rely on yarn.lock so the build works even if the
# lockfile isn't present in the repo.
COPY . .
RUN yarn install

# Empty value => frontend calls the API at the relative path "/api",
# which the container's Nginx proxies to the backend service.
ARG REACT_APP_BACKEND_URL=""
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
RUN yarn build

# ---- Serve stage ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
