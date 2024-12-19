FROM nginx:1.25-alpine
# Remove the default nginx.conf provided by the image
RUN rm /etc/nginx/nginx.conf
# Copy custom configuration file into the image
COPY ./nginx.conf /etc/nginx/nginx.conf
# Copy single page application into serving directory
COPY dist/frontend/browser /usr/share/nginx/html/
