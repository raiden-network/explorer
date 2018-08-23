FROM python:3.6

LABEL Name=backend Version=0.0.1 Author="Paul Lange"
EXPOSE 4567

WORKDIR /app
ADD . /app

RUN python3 -m pip install -r requirements.txt
RUN python3 setup.py develop
CMD ["python3", "metrics_backend/metrics_cli.py"]
