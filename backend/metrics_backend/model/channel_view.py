from enum import Enum

from eth_utils import is_checksum_address
from metrics_backend.utils import Address, ChannelIdentifier


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
    ) -> None:
        assert is_checksum_address(participant1)
        assert is_checksum_address(participant2)

        self.participant1 = participant1
        self.participant2 = participant2

        self.channel_id = channel_id
        self._deposit_p1 = 0
        self._deposit_p2 = 0
        self.state = ChannelView.State.OPENED

    def update_deposit(
        self,
        participant: Address,
        deposit: int = None,
    ):
        if deposit is not None:
            if participant == self.participant1:
                self._deposit_p1 = deposit
            elif participant == self.participant2:
                self._deposit_p2 = deposit

    def update_state(self, new_state: State):
        if new_state is not None:
            self.state = new_state

    @property
    def deposit_p1(self) -> int:
        return self._deposit_p1

    @property
    def deposit_p2(self) -> int:
        return self._deposit_p2

    def __repr__(self):
        return '<ChannelView id={} p1={} p2={} state={} deposit_p1={} deposit_p2={}>'.format(
            self.channel_id,
            self.participant1,
            self.participant2,
            self.state,
            self.deposit_p1,
            self.deposit_p2,
        )
