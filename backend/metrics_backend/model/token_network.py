import logging
from typing import Dict

from eth_utils import is_checksum_address
from dataclasses import dataclass
from metrics_backend.utils import Address, ChannelIdentifier

from metrics_backend.model import ChannelView


log = logging.getLogger(__name__)


@dataclass
class TokenInfo:
    address: str
    name: str
    symbol: str
    decimals: int


class TokenNetwork:
    """ Manages a token network for pathfinding. """

    def __init__(self, token_network_address: Address, token_info: TokenInfo) -> None:
        """ Initializes a new TokenNetwork. """

        self.address = token_network_address
        self.token_info = token_info
        self.channels: Dict[ChannelIdentifier, ChannelView] = dict()

    def handle_channel_opened_event(
        self,
        channel_identifier: ChannelIdentifier,
        participant1: Address,
        participant2: Address,
    ):
        """ Register a new channel.

        Corresponds to the ChannelOpened event."""

        assert is_checksum_address(participant1)
        assert is_checksum_address(participant2)

        view = ChannelView(channel_identifier, participant1, participant2)
        self.channels[channel_identifier] = view

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
            self.channels[channel_identifier].update_deposit(receiver, total_deposit)
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
            self.channels[channel_identifier].update_state(ChannelView.State.CLOSED)
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
            self.channels[channel_identifier].update_state(ChannelView.State.SETTLED)
        except KeyError:
            log.error(
                "Received ChannelSettle event for unknown channel '{}'".format(
                    channel_identifier
                )
            )
