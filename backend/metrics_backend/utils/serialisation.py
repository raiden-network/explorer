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
    """ Return a JSON serialized version of the token network.

    {
        "token_address": "0xsomething",
        "num_nodes": 3,
        "num_channels": 4,
        "nodes": [
            "0xalbert",
            "0xberta",
            "0xceasar",
        ],
        "channels": [
            {
                "channel_identifier": "0xchannel",
                "status": "open",
                "participant1": "0xalbert",
                "participant2": "0xceasar",
                "deposit1": 100,
                "deposit2": 50,
                "withdraw1": 20,
                "withdraw2": 0,
            },
            ...
        ],
    }
    """
    num_channels_opened = 0
    num_channels_closed = 0
    num_channels_settled = 0

    participants: List[str] = []
    channels = []
    for channel_id in token_network.channel_id_to_addresses.keys():
        ends = token_network.channel_id_to_addresses[channel_id]
        participants.extend(ends)

        p1, p2 = ends

        try:
            view1 = token_network.G[p1][p2]['view']
            view2 = token_network.G[p2][p1]['view']
        except Exception:
            raise RuntimeError('Topology out of sync! %s, %s', p1, p2)

        channel = dict(
            channel_identifier=channel_id,
            status=_state_to_str(view1.state),
            participant1=ends[0],
            participant2=ends[1],
            deposit1=view1.deposit,
            deposit2=view2.deposit,
        )
        channels.append(channel)

        if view1.state == ChannelView.State.OPENED:
            num_channels_opened += 1
        elif view1.state == ChannelView.State.CLOSED:
            num_channels_closed += 1
        elif view1.state == ChannelView.State.SETTLED:
            num_channels_settled += 1

    # sets are not json serializable, convert back to list
    participants_deduped = list(set(participants))

    return dict(
        token_address=token_network.address,
        num_channels_total=len(channels),
        num_channels_opened=num_channels_opened,
        num_channels_closed=num_channels_closed,
        num_channels_settled=num_channels_settled,
        num_nodes=len(participants_deduped),
        nodes=participants_deduped,
        channels=channels,
    )
