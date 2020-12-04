import hashlib
import logging
from typing import Any, Dict
from urllib.parse import urlparse

import gevent
from raiden.constants import DISCOVERY_DEFAULT_ROOM, Environment
from raiden.network.transport.matrix.utils import (
    USER_PRESENCE_TO_ADDRESS_REACHABILITY,
    AddressReachability,
    UserPresence,
    address_from_userid,
    join_broadcast_room,
    login,
    make_client,
    make_room_alias
)
from raiden.settings import DEFAULT_MATRIX_KNOWN_SERVERS
from raiden.utils.cli import get_matrix_servers
from raiden.utils.signer import LocalSigner, Signer
from raiden_contracts.utils.type_aliases import ChainID

log = logging.getLogger(__name__)


class PresenceService(gevent.Greenlet):
    def __init__(
        self,
        privkey_seed: str,
        chain_id: ChainID,
        production_environment: bool,
        server: str = None
    ) -> None:
        """ Creates a new presence service listening on matrix presence updates
        in the discovery room

        Args:
            privkey_seed: Seed for generating a private key for matrix login
            chain_id: Chain id to listen on presence
            production_environment: Determines which matrix server to use if none is explicitly set
            server: Matrix server
        """
        super().__init__()
        self.signer = LocalSigner(hashlib.sha256(privkey_seed.encode()).digest())
        self.server = server
        self.chain_id = chain_id
        self.production_environment = production_environment

        self.is_running = gevent.event.Event()

        self.nodes_presence_status: Dict[bytes, bool] = {}
        log.info('Using address %s for matrix login', self.signer.address_hex)

    def _run(self):
        available_servers = [self.server]
        if not self.server:
            environment_type = Environment.PRODUCTION if self.production_environment else Environment.DEVELOPMENT
            available_servers_url = DEFAULT_MATRIX_KNOWN_SERVERS[environment_type]
            available_servers = get_matrix_servers(available_servers_url)

        client = make_client(lambda x: False, lambda x: None, available_servers)
        self.server = client.api.base_url
        server_name = urlparse(self.server).netloc
        login(client=client, signer=self.signer)
        client.add_presence_listener(self.handle_presence_update)
        client.start_listener_thread(30_000, 1_000)

        discovery_room_alias = make_room_alias(
            self.chain_id, DISCOVERY_DEFAULT_ROOM
        )
        join_broadcast_room(client, f'#{discovery_room_alias}:{server_name}')

        log.info('Presence monitoring started, server: %s', self.server)
        self.is_running.wait()
        client.stop()

    def stop(self):
        self.is_running.set()

    def handle_presence_update(self, event: Dict[str, Any], update_id: int) -> None:
        presence = UserPresence(event["content"]["presence"])
        reachable = USER_PRESENCE_TO_ADDRESS_REACHABILITY[presence] == AddressReachability.REACHABLE
        node_address = address_from_userid(event["sender"])
        self.nodes_presence_status[node_address] = reachable

        log.info(
            'Presence update, server: %s, user_id: %s, presence: %s, update_id: %d',
            self.server,
            event["sender"],
            presence,
            update_id
        )
