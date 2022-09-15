FROM node:alpine

LABEL Name=frontend Version=0.0.1 Author="Paul Lange"
EXPOSE 3000

WORKDIR /frontend
ADD . /frontend

RUN npm install -g @angular/cli@7.2.1 && npm ci && npm install express cors

ARG backend_url
ARG poll_interval
ARG etherscan_base_url
ARG network_name
ARG echo_node_address=""
ARG matomo_tracker_url=""
ARG matomo_site_id=""
ARG matomo_script_url=""

RUN cat ./src/assets/config/config.TEMPLATE.json \
    | sed "s#BACKEND_URL#${backend_url}#" \
    | sed "s#POLL_INTERVAL#${poll_interval}#" \
    | sed "s#ETHERSCAN_BASE_URL#${etherscan_base_url}#" \
    | sed "s#ECHO_NODE_ADDRESS#${echo_node_address}#" \
    | sed "s#NETWORK_NAME#${network_name}#" \
    | sed "s#MATOMO_TRACKER_URL#${matomo_tracker_url}#" \
    | sed "s#MATOMO_SITE_ID#${matomo_site_id}#" \
    | sed "s#MATOMO_SCRIPT_URL#${matomo_script_url}#" \
    > ./src/assets/config/config.production.json

ENV NODE_OPTIONS=--openssl-legacy-provider
RUN ng build --prod
CMD ["node", "serv-dist/serv.js"]
