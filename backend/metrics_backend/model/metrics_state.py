import logging
from typing import Dict

from eth_utils import is_checksum_address
from metrics_backend.utils import Address


log = logging.getLogger(__name__)


class MetricsState:
    """ Manages the overall metrics. """

    def __init__(self) -> None:
        """ Initializes the metrics state. """

        self.num_token_networks = 0
        self.num_channels_opened = 0
        self.num_channels_closed = 0
        self.num_channels_settled = 0
        self.open_channels_by_participant: Dict[Address, int] = dict()

    def handle_channel_opened_event(
        self,
        participant1: Address,
        participant2: Address,
    ):
        assert is_checksum_address(participant1)
        assert is_checksum_address(participant2)

        self.num_channels_opened += 1
        self._add_opened_channel_to_participant(participant1)
        self._add_opened_channel_to_participant(participant2)

    def handle_channel_closed_event(
        self,
        participant1: Address,
        participant2: Address,
    ):
        assert is_checksum_address(participant1)
        assert is_checksum_address(participant2)

        self.num_channels_opened -= 1
        self.num_channels_closed += 1
        self._remove_opened_channel_from_participant(participant1)
        self._remove_opened_channel_from_participant(participant2)

    def handle_channel_settled_event(self):
        self.num_channels_closed -= 1
        self.num_channels_settled += 1

    def handle_token_network_created(self):
        self.num_token_networks += 1

    def _add_opened_channel_to_participant(self, participant: Address):
        if not participant in self.open_channels_by_participant:
            self.open_channels_by_participant[participant] = 0
        self.open_channels_by_participant[participant] += 1
    
    def _remove_opened_channel_from_participant(self, participant: Address):
        try:
            self.open_channels_by_participant[participant] -= 1
        except KeyError:
            log.error(
                "Received ChannelClosed event for unknown participant '{}'".format(
                    participant
                )
            )
