# Raiden Explorer

[The Raiden Explorer](https://explorer.raiden.network) displays information about the status of the [Raiden Network](https://raiden.network/).

## Running

The Explorer can be run by using `docker-compose`:
```sh
docker-compose build
docker-compose up -d
```

It's important to update the [frontend config files](https://github.com/raiden-network/explorer/tree/master/frontend/src/assets/config) because otherwise the official Explorer backend is used.

## Frontend

The frontend is built using [Angular](https://angular.io) and required NodeJS. It can be found in the `frontend` directory.

To launch a development version of the frontend, install angular globally and run the angular development server:
```bash
npm install -g @angular/cli
cd angular-app
npm install
ng serve
```

## Backend

The backend is written in Python and can be found in the `backend` directory.
