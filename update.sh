#!/usr/bin/env bash
set -e
git pull
docker-compose build
docker-compose down
docker-compose up -d
