from gevent import monkey, config  # isort:skip # noqa
# there were some issues with the 'thread' resolver, remove it from the options
config.resolver = ['dnspython', 'ares', 'block']  # noqa
monkey.patch_all()  # isort:skip # noqa

import logging
import os
import sys
import json
import warnings
import requests
import contextlib

from functools import partialmethod

import click
import gevent
from eth_utils import is_checksum_address
from web3 import HTTPProvider, Web3
from web3.middleware import geth_poa_middleware
from requests.exceptions import ConnectionError
from raiden_contracts.contract_manager import (
    ContractManager,
    contracts_precompiled_path,
    get_contracts_deployment_info,
)
from raiden_contracts.constants import CONTRACT_TOKEN_NETWORK_REGISTRY

from metrics_backend.api.rest import NetworkInfoAPI
from metrics_backend.metrics_service import MetricsService
from metrics_backend.utils.serialisation import token_network_to_dict

log = logging.getLogger(__name__)

DEFAULT_PORT = 4567
OUTPUT_FILE = 'network-info.json'
TEMP_FILE = 'tmp.json'
OUTPUT_PERIOD = 10  # seconds
REQUIRED_CONFIRMATIONS = 8  # ~2min with 15s blocks


@contextlib.contextmanager
def no_ssl_verification():
    old_request = requests.Session.request
    requests.Session.request = partialmethod(old_request, verify=False)

    warnings.filterwarnings('ignore', 'Unverified HTTPS request')
    yield
    warnings.resetwarnings()

    requests.Session.request = old_request


@click.command()
@click.option(
    '--eth-rpc',
    default='http://geth.ropsten.ethnodes.brainbot.com:8545',
    type=str,
    help='Ethereum node RPC URI'
)
@click.option(
    '--registry-address',
    type=str,
    help='Address of the token network registry'
)
@click.option(
    '--start-block',
    default=0,
    type=int,
    help='Block to start syncing at'
)
@click.option(
    '--port',
    default=DEFAULT_PORT,
    type=int,
    help='Port to provide the REST endpoint on'
)
@click.option(
    '--confirmations',
    default=REQUIRED_CONFIRMATIONS,
    type=int,
    help='Number of block confirmations to wait for'
)
@click.option(
    '--use-production-contracts',
    default=True,
    type=bool,
    help='Use the production version of the contracts'
)
def main(
    eth_rpc,
    registry_address,
    start_block,
    port,
    confirmations,
    use_production_contracts,
):
    # setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%m-%d %H:%M:%S',
    )

    logging.getLogger('web3').setLevel(logging.INFO)
    logging.getLogger('urllib3.connectionpool').setLevel(logging.ERROR)

    log.info("Starting Raiden Metrics Server")
    try:
        log.info(f'Starting Web3 client for node at {eth_rpc}')
        web3 = Web3(HTTPProvider(eth_rpc))
        web3.middleware_stack.inject(geth_poa_middleware, layer=0)
    except ConnectionError:
        log.error(
            'Can not connect to the Ethereum client. Please check that it is running and that '
            'your settings are correct.'
        )
        sys.exit()

    contracts_version = '0.4.0' if use_production_contracts else '0.10.1'
    log.info(f'Using contracts version: {contracts_version}')

    with no_ssl_verification():
        valid_params_given = is_checksum_address(registry_address) and start_block >= 0
        if not valid_params_given:
            try:
                contract_data = get_contracts_deployment_info(int(web3.net.version), contracts_version)
                token_network_registry_info = contract_data['contracts'][CONTRACT_TOKEN_NETWORK_REGISTRY]  # noqa
                registry_address = token_network_registry_info['address']
                start_block = max(0, token_network_registry_info['block_number'])
            except ValueError:
                log.error(
                    'Provided registry address or start block are not valid and '
                    'no deployed contracts were found'
                )
                sys.exit(1)

        try:
            service = MetricsService(
                web3=web3,
                contract_manager=ContractManager(contracts_precompiled_path()),
                registry_address=registry_address,
                sync_start_block=start_block,
                required_confirmations=confirmations,
            )

            # re-enable once deployment works
            # gevent.spawn(write_topology_task, service)

            api = NetworkInfoAPI(service)
            api.run(port=port)
            print(f'Running metrics endpoint at http://localhost:{port}/json')

            print('Raiden Status Page backend running...')
            service.run()

        except (KeyboardInterrupt, SystemExit):
            print('Exiting...')
        finally:
            if service:
                log.info('Stopping Raiden Metrics Backend')
                service.stop()

    return 0


def write_topology_task(pathfinding_service: MetricsService):
    while True:
        result = dict(
            num_networks=len(pathfinding_service.token_networks),
        )

        result.update(
            {
                network.address: token_network_to_dict(network)
                for network in pathfinding_service.token_networks.values()
            }
        )

        # write to a temp file, then rename to have a consistent file all the time
        # rename is atomic
        with open(TEMP_FILE, 'w') as f:
            json.dump(result, f)

        os.rename(TEMP_FILE, OUTPUT_FILE)
        log.info(f'Wrote network infos to {OUTPUT_FILE}')

        gevent.sleep(OUTPUT_PERIOD)


if __name__ == "__main__":
    main(auto_envvar_prefix='EXPLORER')
