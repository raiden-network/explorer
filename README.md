# Raiden Explorer

[The Raiden Explorer](https://explorer.raiden.network) displays information about the status of the [Raiden Network](https://raiden.network/).

## Running

The Explorer can be run by using `docker-compose`. This will build the docker images and run multiple instances of the explorer for mainnet and all supported testnets.

```sh
docker-compose build
docker-compose up -d
```

## Frontend

The frontend is built using [Angular](https://angular.io) and requires NodeJS. It can be found in the `frontend` directory.

To launch a development version of the frontend, install the dependencies and run the angular development server:

```sh
cd frontend
npm install
npm start
```

It's important to update the [frontend config files](https://github.com/raiden-network/explorer/tree/master/frontend/src/assets/config) because otherwise the official Explorer backend is used.

## Backend

The backend is written in Python and can be found in the `backend` directory.

To launch a development version of the backend, install the dependencies and run the cli service. Please do so from a virtual environment.

```sh
cd backend
make install-dev
python -m  metrics_backend.metrics_cli
```

There are a couple of cli options to configure the backend, such as the ethereum node to use. See [metrics_cli.py](backend/metrics_backend/metrics_cli.py) for reference.
