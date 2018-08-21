FROM node:alpine

MAINTAINER brainbot labs (jonas)

# ARG

WORKDIR /app

ADD ./dist /app
COPY ./src/prod-serv.js /app
RUN npm init -y
RUN npm i express cors

EXPOSE 8080

CMD ["node", "prod-serv.js"]
