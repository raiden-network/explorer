from gevent import monkey  # isort:skip # noqa
monkey.patch_all()  # isort:skip # noqa

import contextlib
import json
import logging
import os
import sys
import warnings
from functools import partialmethod

import click
import gevent
import requests
from eth_utils import is_checksum_address, to_canonical_address
from raiden_contracts.constants import (
    CONTRACT_SERVICE_REGISTRY,
    CONTRACT_TOKEN_NETWORK_REGISTRY,
    CONTRACTS_VERSION
)
from raiden_contracts.contract_manager import (
    ContractManager,
    contracts_precompiled_path,
    get_contracts_deployment_info
)
from requests.exceptions import ConnectionError
from web3 import HTTPProvider, Web3

from metrics_backend.api.rest import NetworkInfoAPI
from metrics_backend.metrics_service import MetricsService
from metrics_backend.presence_service import PresenceService
from metrics_backend.utils.serialisation import token_network_to_dict

log = logging.getLogger(__name__)

DEFAULT_PORT = 4567
OUTPUT_FILE = 'network-info.json'
TEMP_FILE = 'tmp.json'
OUTPUT_PERIOD = 10  # seconds
REQUIRED_CONFIRMATIONS = 5
PRODUCTION_CONTRACTS_VERSION = '0.37.0'
DEMOENV_CONTRACTS_VERSION = '0.37.0'


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
    '--environment',
    default='production',
    type=click.Choice(['production', 'development', 'demo'], case_sensitive=False),
    help=(
        'Change the version of the used contracts and transport server '
        'by setting the environment to "production" (default), "development" or "demo"'
    )
)
def main(
    eth_rpc,
    registry_address,
    start_block,
    port,
    confirmations,
    environment
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
    except ConnectionError:
        log.error(
            'Can not connect to the Ethereum client. Please check that it is running and that '
            'your settings are correct.'
        )
        sys.exit()

    if environment == 'production':
        contracts_version = PRODUCTION_CONTRACTS_VERSION
    elif environment == 'demo':
        contracts_version = DEMOENV_CONTRACTS_VERSION
    else:
        contracts_version = CONTRACTS_VERSION
    log.info(f'Using contracts version: {contracts_version}')

    with no_ssl_verification():
        valid_params_given = is_checksum_address(registry_address) and start_block >= 0
        try:
            contract_data = get_contracts_deployment_info(web3.eth.chainId, contracts_version)
            service_registry_address = contract_data['contracts'][CONTRACT_SERVICE_REGISTRY]['address']
            if not valid_params_given:
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
            contract_manager = ContractManager(contracts_precompiled_path(contracts_version))

            metrics_service = MetricsService(
                web3=web3,
                contract_manager=contract_manager,
                registry_address=registry_address,
                sync_start_block=start_block,
                required_confirmations=confirmations,
            )

            presence_service = PresenceService(
                privkey_seed=f'EXPLORER_{web3.eth.chainId}',
                contract_manager=contract_manager,
                web3=web3,
                block_confirmations=REQUIRED_CONFIRMATIONS,
                service_registry_address=to_canonical_address(service_registry_address),
            )

            # re-enable once deployment works
            # gevent.spawn(write_topology_task, service)

            api = NetworkInfoAPI(metrics_service, presence_service)
            api.run(port=port)
            print(f'Running metrics endpoint at http://localhost:{port}/json')

            print('Raiden Status Page backend running...')
            metrics_service.start()
            presence_service.start()
            gevent.joinall([metrics_service, presence_service])

        except (KeyboardInterrupt, SystemExit):
            print('Exiting...')
        finally:
            if metrics_service:
                log.info('Stopping Raiden Metrics Backend')
                metrics_service.stop()
            if presence_service:
                log.info('Stopping Raiden Presence Backend')
                presence_service.stop()

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
