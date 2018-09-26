FROM node:alpine

LABEL Name=frontend Version=0.0.1 Author="Paul Lange"
EXPOSE 3000

WORKDIR /frontend
ADD . /frontend

# We're only on testnet so far
RUN mv -f ./src/assets/config/config.development.json ./src/assets/config/config.production.json

RUN npm install -g @angular/cli && npm install && ng build --prod && npm install express cors
CMD ["node", "serv-dist/serv.js"]
 