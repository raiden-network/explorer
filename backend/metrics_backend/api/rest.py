from typing import Tuple, Dict, List

import gevent
from flask import Flask
from flask_restful import Api, Resource
from flask_cors import CORS
from gevent import Greenlet
from gevent.pywsgi import WSGIServer

from metrics_backend.metrics_service import MetricsService
from metrics_backend.utils.serialisation import token_network_to_dict


class NetworkInfoResource(Resource):
    def __init__(self, metrics_service: MetricsService) -> None:
        self.metrics_service = metrics_service

    def get(self):
        result = dict(
            num_networks=len(self.metrics_service.token_networks),
        )

        result.update(
            {
                network.address: token_network_to_dict(network)
                for network in self.metrics_service.token_networks.values()
            }
        )
        return {'result': result}, 200


class NetworkInfoAPI:
    def __init__(self, metrics_service: MetricsService) -> None:
        self.flask_app = Flask(__name__)
        CORS(self.flask_app)
        self.api = Api(self.flask_app)
        self.rest_server: WSGIServer = None
        self.server_greenlet: Greenlet = None

        resources: List[Tuple[str, Resource, Dict]] = [
            ('/info', NetworkInfoResource, {}),
        ]

        for endpoint_url, resource, kwargs in resources:
            kwargs['metrics_service'] = metrics_service
            self.api.add_resource(resource, endpoint_url, resource_class_kwargs=kwargs)

    def run(self, port: int = 5002):
        self.rest_server = WSGIServer(('localhost', port), self.flask_app)
        self.server_greenlet = gevent.spawn(self.rest_server.serve_forever)
