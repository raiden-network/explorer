FROM node:alpine

LABEL Name=frontend Version=0.0.1 Author="Paul Lange"
EXPOSE 3000

ARG backend_url
ARG poll_interval
ARG etherscan_base_url
ARG network_type
ARG echo_node_address=""

WORKDIR /frontend
ADD . /frontend

RUN npm install -g @angular/cli && npm install && npm install express cors

RUN cat ./src/assets/config/config.TEMPLATE.json \
    | sed "s#BACKEND_URL#${backend_url}#" \
    | sed "s#POLL_INTERVAL#${poll_interval}#" \
    | sed "s#ETHERSCAN_BASE_URL#${etherscan_base_url}#" \
    | sed "s#NETWORK_TYPE#${network_type}#" \
    | sed "s#ECHO_NODE_ADDRESS#${echo_node_address}#" \
    > ./src/assets/config/config.production.json

RUN ng build --prod
CMD ["node", "serv-dist/serv.js"]
 