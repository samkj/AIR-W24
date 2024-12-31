FROM node:22.12.0 as build

WORKDIR /usr/local/app

COPY ./ /usr/local/app/

RUN rm -rf node_modules package-lock.json

RUN npm install

RUN npm run build

FROM nginx:1.25-alpine
# Remove the default nginx.conf provided by the image
RUN rm /etc/nginx/nginx.conf
# Copy custom configuration file into the image
COPY ./nginx.conf /etc/nginx/nginx.conf
# Copy single page application into serving directory
COPY --from=build /usr/local/app/dist/frontend/browser /usr/share/nginx/html
