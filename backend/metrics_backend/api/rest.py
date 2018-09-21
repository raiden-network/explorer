from typing import Tuple, Dict, List
from operator import attrgetter

import gevent
from flask import Flask
from flask_restful import Api, Resource
from flask_cors import CORS
from gevent import Greenlet
from gevent.pywsgi import WSGIServer
from cachetools import TTLCache, cachedmethod

from metrics_backend.metrics_service import MetricsService
from metrics_backend.utils.serialisation import token_network_to_dict


class NetworkInfoResource(Resource):
    def __init__(self, metrics_service: MetricsService) -> None:
        self.metrics_service = metrics_service
        self._cache = TTLCache(maxsize=1, ttl=10)

    @cachedmethod(attrgetter('_cache'))
    def get(self):
        result = [
            token_network_to_dict(network)
            for network in self.metrics_service.token_networks.values()
        ]
        return {'result': result}, 200


class NetworkInfoAPI:
    def __init__(self, metrics_service: MetricsService) -> None:
        self.flask_app = Flask(__name__)
        CORS(self.flask_app)
        self.api = Api(self.flask_app)
        self.rest_server: WSGIServer = None
        self.server_greenlet: Greenlet = None

        resources: List[Tuple[str, Resource, Dict]] = [
            ('/json', NetworkInfoResource, {}),
        ]

        for endpoint_url, resource, kwargs in resources:
            kwargs['metrics_service'] = metrics_service
            self.api.add_resource(resource, endpoint_url, resource_class_kwargs=kwargs)

    def run(self, port: int = 5002):
        self.rest_server = WSGIServer(('0.0.0.0', port), self.flask_app)
        self.server_greenlet = gevent.spawn(self.rest_server.serve_forever)
