import hashlib
import logging
import math
from typing import Dict, List

import gevent
import requests
from eth_utils.address import to_canonical_address, to_checksum_address
from raiden_common.constants import BLOCK_ID_LATEST
from raiden_common.network.pathfinding import get_random_pfs
from raiden_common.network.proxies.service_registry import ServiceRegistry
from raiden_common.network.rpc.client import JSONRPCClient
from requests import ConnectionError, HTTPError, Timeout
from web3 import Web3

from metrics_backend.utils import Address

log = logging.getLogger(__name__)


class PresenceService(gevent.Greenlet):
    def __init__(
        self,
        privkey_seed: str,
        contract_manager,
        web3: Web3,
        block_confirmations: int,
        service_registry_address: Address,
        poll_interval: int = 30,
        error_poll_interval: int = 600,
    ) -> None:
        """Creates a new presence service getting the online status of nodes from a PFS"""
        super().__init__()
        self.running = False
        self.poll_interval = poll_interval
        self.error_poll_interval = error_poll_interval
        jsonrpc_client = JSONRPCClient(
            web3=web3,
            privkey=hashlib.sha256(privkey_seed.encode()).digest(),
            block_num_confirmations=block_confirmations,
        )
        self.service_registry = ServiceRegistry(
            jsonrpc_client=jsonrpc_client,
            service_registry_address=service_registry_address,
            contract_manager=contract_manager,
            block_identifier=BLOCK_ID_LATEST,
        )
        self.nodes_presence_status: Dict[bytes, bool] = {}

    def _run(self):
        self.running = True

        pfs_url = get_random_pfs(
            service_registry=self.service_registry,
            block_identifier=BLOCK_ID_LATEST,
            pathfinding_max_fee=math.inf,
        )
        if pfs_url is None:
            self.running = False
            log.warning(
                "Could not get a PFS from ServiceRegistry %s. Disabling presence monitoring.",
                to_checksum_address(self.service_registry.address),
            )
            return

        log.info("Presence service started, PFS: %s", pfs_url)
        log.info("Presence polling interval: %ss", self.poll_interval)
        while self.running:
            try:
                response = requests.get(f"{pfs_url}/api/v1/online_addresses")
                response.raise_for_status()
                self.update_presence(response.json())
                gevent.sleep(self.poll_interval)
            except (ConnectionError, HTTPError, Timeout):
                log.warning(
                    "Error while trying to request from the PFS. Retrying in %d seconds.",
                    self.error_poll_interval,
                )
                gevent.sleep(self.error_poll_interval)

        log.info("Stopped presence service")

    def stop(self):
        self.running = False

    def update_presence(self, online_addresses: List[str]):
        self.nodes_presence_status = {
            to_canonical_address(address): True for address in online_addresses
        }
        log.info(
            "Presence update, number of online nodes: %d",
            len(online_addresses),
        )
