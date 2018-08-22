import logging
from typing import Dict, Tuple

from networkx import DiGraph
from eth_utils import is_checksum_address
from raiden_libs.types import Address, ChannelIdentifier

from metrics_backend.model import ChannelView


log = logging.getLogger(__name__)


class TokenNetwork:
    """ Manages a token network for pathfinding. """

    def __init__(self, token_network_address: Address) -> None:
        """ Initializes a new TokenNetwork. """

        self.address = token_network_address
        self.channel_id_to_addresses: Dict[ChannelIdentifier, Tuple[Address, Address]] = dict()
        self.G = DiGraph()

    def handle_channel_opened_event(
        self,
        channel_identifier: ChannelIdentifier,
        participant1: Address,
        participant2: Address,
    ):
        """ Register the channel in the graph, add participents to graph if necessary.

        Corresponds to the ChannelOpened event. Called by the contract event listener. """

        assert is_checksum_address(participant1)
        assert is_checksum_address(participant2)

        self.channel_id_to_addresses[channel_identifier] = (participant1, participant2)

        view1 = ChannelView(channel_identifier, participant1, participant2, deposit=0)
        view2 = ChannelView(channel_identifier, participant2, participant1, deposit=0)

        self.G.add_edge(participant1, participant2, view=view1)
        self.G.add_edge(participant2, participant1, view=view2)

    def handle_channel_new_deposit_event(
        self,
        channel_identifier: ChannelIdentifier,
        receiver: Address,
        total_deposit: int
    ):
        """ Register a new balance for the beneficiary.

        Corresponds to the ChannelNewDeposit event."""

        assert is_checksum_address(receiver)

        try:
            participant1, participant2 = self.channel_id_to_addresses[channel_identifier]

            if receiver == participant1:
                self.G[participant1][participant2]['view'].update_capacity(deposit=total_deposit)
            elif receiver == participant2:
                self.G[participant2][participant1]['view'].update_capacity(deposit=total_deposit)
            else:
                log.error(
                    "Receiver in ChannelNewDeposit does not fit the internal channel"
                )
        except KeyError:
            log.error(
                "Received ChannelNewDeposit event for unknown channel '{}'".format(
                    channel_identifier
                )
            )

    def handle_channel_closed_event(self, channel_identifier: ChannelIdentifier):
        """ Close a channel. This doesn't mean that the channel is settled yet, but it cannot
        transfer any more.

        Corresponds to the ChannelClosed event."""

        try:
            participant1, participant2 = self.channel_id_to_addresses[channel_identifier]

            self.G[participant1][participant2]['view'].update_state(ChannelView.State.CLOSED)
            self.G[participant2][participant1]['view'].update_state(ChannelView.State.CLOSED)
        except KeyError:
            log.error(
                "Received ChannelClosed event for unknown channel '{}'".format(
                    channel_identifier
                )
            )

    def handle_channel_settled_event(self, channel_identifier: ChannelIdentifier):
        """ Settle a channel.

        Corresponds to the ChannelSettled event."""

        try:
            participant1, participant2 = self.channel_id_to_addresses[channel_identifier]

            self.G[participant1][participant2]['view'].update_state(ChannelView.State.SETTLED)
            self.G[participant2][participant1]['view'].update_state(ChannelView.State.SETTLED)
        except KeyError:
            log.error(
                "Received ChannelClosed event for unknown channel '{}'".format(
                    channel_identifier
                )
            )
