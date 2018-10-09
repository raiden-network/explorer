from typing import Dict, List

from metrics_backend.model import TokenNetwork, ChannelView


def _state_to_str(state: ChannelView.State) -> str:
    if state == ChannelView.State.OPENED:
        return 'opened'
    elif state == ChannelView.State.CLOSED:
        return 'closed'
    elif state == ChannelView.State.SETTLED:
        return 'settled'
    else:
        return 'unknown'


def token_network_to_dict(token_network: TokenNetwork) -> Dict:
    """ Returns a JSON serialized version of the token network. """
    num_channels_opened = 0
    num_channels_closed = 0
    num_channels_settled = 0

    participants: List[str] = []
    channels = []
    for channel_id, view in token_network.channels.items():
        participants.append(view.participant1)
        participants.append(view.participant2)

        channel = dict(
            channel_identifier=channel_id,
            status=_state_to_str(view.state),
            participant1=view.participant1,
            participant2=view.participant2,
            deposit1=view.deposit_p1,
            deposit2=view.deposit_p2,
        )
        channels.append(channel)

        if view.state == ChannelView.State.OPENED:
            num_channels_opened += 1
        elif view.state == ChannelView.State.CLOSED:
            num_channels_closed += 1
        elif view.state == ChannelView.State.SETTLED:
            num_channels_settled += 1

    # sets are not json serializable, convert back to list
    participants_deduped = list(set(participants))

    return dict(
        address=token_network.address,
        token=dict(
            address=token_network.token_info.address,
            name=token_network.token_info.name,
            symbol=token_network.token_info.symbol,
            decimals=token_network.token_info.decimals,
        ),
        num_channels_total=len(channels),
        num_channels_opened=num_channels_opened,
        num_channels_closed=num_channels_closed,
        num_channels_settled=num_channels_settled,
        num_nodes=len(participants_deduped),
        nodes=participants_deduped,
        channels=channels,
    )
