# ctrlTAB web — nginx met de statische frontend en een /api/-proxy.
#
# Upstream proxyde hard naar de docker-compose-servicenaam `api`, waardoor de
# Kubernetes-uitrol een eigen ConfigMap met een aangepaste config nodig had. Hier
# staat de upstream in een template: de officiele nginx-image draait bij het
# starten envsubst over /etc/nginx/templates/*.template en vervangt daarbij alleen
# namen die echt als omgevingsvariabele bestaan, dus nginx-variabelen als $uri
# blijven intact.
#
# Daardoor draait dezelfde image onder docker-compose (API_HOST=api) en in
# Kubernetes (API_HOST=ctrltab-api), zonder ConfigMap.

FROM nginx:alpine

ENV API_HOST=api \
    API_PORT=3000

RUN rm /etc/nginx/conf.d/default.conf
COPY templates/default.conf.template /etc/nginx/templates/default.conf.template
COPY html/ /usr/share/nginx/html/

EXPOSE 80
