#!/usr/bin/env bash
git pull
docker-compose build
docker-compose stop
docker-compose up -d
