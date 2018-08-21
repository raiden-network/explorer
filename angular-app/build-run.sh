docker build -t raiden-status -f Dockerfile.sh .

docker rm -f raiden-status && \
  docker run \
  --name=raiden-status \
  --restart=always \
 -d \
 -p 8888:4200 \
  raiden-status
  # --net="host" \
