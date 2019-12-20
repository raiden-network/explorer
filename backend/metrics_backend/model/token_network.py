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

@dataclass 
class ParticipantsChannels:
    opened: int
    closed: int
    settled: int


class TokenNetwork:
    """ Manages a token network for pathfinding. """

    def __init__(self, token_network_address: Address, token_info: TokenInfo) -> None:
        """ Initializes a new TokenNetwork. """

        self.address = token_network_address
        self.token_info = token_info
        self.channels: Dict[ChannelIdentifier, ChannelView] = dict()
        self.participants: Dict[Address, ParticipantsChannels] = dict()

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

        self._add_opened_channel_to_participant(participant1)
        self._add_opened_channel_to_participant(participant2)

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
    
    def handle_channel_withdraw_event(
        self,
        channel_identifier: ChannelIdentifier,
        withdrawing_participant: Address,
        total_withdraw: int
    ):
        """ Register a new withdraw for the withdrawing participant.

        Corresponds to the ChannelWithdraw event."""

        assert is_checksum_address(withdrawing_participant)

        if not channel_identifier in self.channels:
            log.error(
                "Received ChannelWithdraw event for unknown channel '{}'".format(
                    channel_identifier
                )
            )
            return

        self.channels[channel_identifier].withdraw(withdrawing_participant, total_withdraw)

    def handle_channel_closed_event(self, channel_identifier: ChannelIdentifier):
        """ Close a channel. This doesn't mean that the channel is settled yet, but it cannot
        transfer any more.

        Corresponds to the ChannelClosed event."""

        try:
            channel = self.channels[channel_identifier]
            channel.update_state(ChannelView.State.CLOSED)
        
            self._add_closed_channel_to_participant(channel.participant1)
            self._add_closed_channel_to_participant(channel.participant2)
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
            channel = self.channels[channel_identifier]
            channel.update_state(ChannelView.State.SETTLED)
        
            self._add_settled_channel_to_participant(channel.participant1)
            self._add_settled_channel_to_participant(channel.participant2)
        except KeyError:
            log.error(
                "Received ChannelSettle event for unknown channel '{}'".format(
                    channel_identifier
                )
            )
    
    def get_channel(self, channel_identifier: ChannelIdentifier):
        if not channel_identifier in self.channels.keys():
            return None
        else:
            return self.channels[channel_identifier]

    def _add_opened_channel_to_participant(self, participant: Address):
        if not participant in self.participants:
            self.participants[participant] = ParticipantsChannels(0, 0, 0)
        self.participants[participant].opened += 1
    
    def _add_closed_channel_to_participant(self, participant: Address):
        self.participants[participant].opened -= 1
        self.participants[participant].closed += 1
    
    def _add_settled_channel_to_participant(self, participant: Address):
        self.participants[participant].closed -= 1
        self.participants[participant].settled += 1
