from typing import Dict, List
from functools import reduce

from metrics_backend.model import TokenNetwork, ChannelView, MetricsState
from metrics_backend.utils import Address


def _state_to_str(state: ChannelView.State) -> str:
    if state == ChannelView.State.OPENED:
        return 'opened'
    elif state == ChannelView.State.CLOSED:
        return 'closed'
    elif state == ChannelView.State.SETTLED:
        return 'settled'
    else:
        return 'unknown'

def _calculate_channels_per_node(
    channels_by_participants: Dict[Address, Dict[str, int]],
    num_participants: int,
) -> float:
    num_channels = reduce(
        lambda acc, channels:acc + channels['opened'],
        channels_by_participants.values(),
        0,
    )
    return num_channels / num_participants if num_participants > 0 else 0

def token_network_to_dict(token_network: TokenNetwork) -> Dict:
    """ Returns a JSON serialized version of the token network. """
    num_channels_opened = 0
    num_channels_closed = 0
    num_channels_settled = 0

    channels = []
    total_deposits = 0

    for channel_id, view in token_network.channels.items():
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
            total_deposits += view.deposit_p1
            total_deposits += view.deposit_p2
        elif view.state == ChannelView.State.CLOSED:
            num_channels_closed += 1
        elif view.state == ChannelView.State.SETTLED:
            num_channels_settled += 1

    num_nodes_with_open_channels = reduce(
        lambda acc, channels:acc + (1 if channels['opened'] > 0 else 0),
        token_network.participants.values(),
        0,
    )

    if num_channels_opened > 0:
        avg_deposit_per_channel = total_deposits / num_channels_opened
    else:
        avg_deposit_per_channel = 0

    if num_nodes_with_open_channels > 0:
        avg_deposit_per_node = total_deposits / num_nodes_with_open_channels
    else:
        avg_deposit_per_node = 0
        
    avg_channels_per_node = _calculate_channels_per_node(
        token_network.participants,
        num_nodes_with_open_channels,
    )

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
        total_deposits=total_deposits,
        avg_deposit_per_channel=avg_deposit_per_channel,
        avg_deposit_per_node=avg_deposit_per_node,
        avg_channels_per_node=avg_channels_per_node,
        channels=channels,
        nodes=token_network.participants,
    )

def metrics_to_dict(metrics_state: MetricsState) -> Dict:
    """ Returns a JSON serialized version of the overall metrics. """
    
    open_channels_by_participant = metrics_state.open_channels_by_participant

    summed_open_channels = reduce(
        lambda acc, channels:acc + channels,
        open_channels_by_participant.values(),
        0,
    )
    num_nodes_with_open_channels = reduce(
        lambda acc, channels:acc + (1 if channels > 0 else 0),
        open_channels_by_participant.values(),
        0,
    )

    if num_nodes_with_open_channels > 0:
        avg_channels_per_node = summed_open_channels / num_nodes_with_open_channels
    else:
        avg_channels_per_node = 0

    top_nodes_by_channels = sorted(
        [
            {'address': node, 'channels': num} 
            for node, num in open_channels_by_participant.items()
        ],
        key=lambda participant:participant['channels']
    )[-5:]

    return dict(
        num_token_networks=metrics_state.num_token_networks,
        num_channels_opened=metrics_state.num_channels_opened,
        num_channels_closed=metrics_state.num_channels_closed,
        num_channels_settled=metrics_state.num_channels_settled,
        num_nodes_with_open_channels=num_nodes_with_open_channels,
        avg_channels_per_node=avg_channels_per_node,
        top_nodes_by_channels=top_nodes_by_channels
    )
