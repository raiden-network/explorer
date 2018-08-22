from gevent import monkey  # isort:skip # noqa
monkey.patch_all()  # isort:skip # noqa

import logging
import os
import sys
import json

import click
import gevent
from web3 import HTTPProvider, Web3
from requests.exceptions import ConnectionError
from raiden_libs.no_ssl_patch import no_ssl_verification
from raiden_contracts.contract_manager import CONTRACT_MANAGER

from metrics_backend.api.rest import NetworkInfoAPI
from metrics_backend.metrics_service import MetricsService
from metrics_backend.utils.serialisation import token_network_to_dict

log = logging.getLogger(__name__)

REGISTRY_ADDRESS = '0x445D79052522eC94078Dfccf96d9302775cA5b4E'
DEFAULT_PORT = 4567
OUTPUT_FILE = 'network-info.json'
TEMP_FILE = 'tmp.json'
OUTPUT_PERIOD = 10  # seconds


@click.command()
@click.option(
    '--eth-rpc',
    default='http://geth.ropsten.ethnodes.brainbot.com:8545',
    type=str,
    help='Ethereum node RPC URI'
)
def main(
    eth_rpc,
):
    # setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%m-%d %H:%M:%S',
    )

    logging.getLogger('web3').setLevel(logging.INFO)
    logging.getLogger('urllib3.connectionpool').setLevel(logging.INFO)

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

    with no_ssl_verification():
        service = None
        try:
            service = MetricsService(
                web3=web3,
                contract_manager=CONTRACT_MANAGER,
                registry_address=REGISTRY_ADDRESS,
                sync_start_block=3_800_000,
            )

            gevent.spawn(write_topology_task, service)

            api = NetworkInfoAPI(service)
            api.run(port=DEFAULT_PORT)
            print(f'Running metrics endpoint at http://localhost:{DEFAULT_PORT}/info')

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
    sys.exit(main())  # pragma: no cover
