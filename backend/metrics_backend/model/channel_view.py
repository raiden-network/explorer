from enum import Enum

from eth_utils import is_checksum_address
from raiden_libs.types import Address, ChannelIdentifier


class ChannelView:
    """
    Unidirectional view of a bidirectional channel.
    """
    class State(Enum):
        OPENED = 'opened',
        CLOSED = 'closed',
        SETTLED = 'settled',

    def __init__(
        self,
        channel_id: ChannelIdentifier,
        participant1: Address,
        participant2: Address,
        deposit: int = 0
    ) -> None:
        assert is_checksum_address(participant1)
        assert is_checksum_address(participant2)

        self.self = participant1
        self.partner = participant2

        self._deposit = deposit
        self.state = ChannelView.State.OPENED
        self.channel_id = channel_id

    def update_capacity(
        self,
        deposit: int = None,
    ):
        if deposit is not None:
            self._deposit = deposit

    def update_state(self, new_state: State):
        if new_state is not None:
            self.state = new_state

    @property
    def deposit(self) -> int:
        return self._deposit

    def __repr__(self):
        return '<ChannelView from={} to={} deposit={}>'.format(
            self.self,
            self.partner,
            self.deposit,
        )
