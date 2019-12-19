export const schema = {
  type: 'object',

  properties: {
    address: { type: 'string' },
    token: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        decimals: { type: 'number' },
        name: { type: 'string' },
        symbol: { type: 'string' }
      }
    },
    num_channels_total: { type: 'number' },
    num_channels_opened: { type: 'number' },
    num_channels_closed: { type: 'number' },
    num_channels_settled: { type: 'number' },
    total_deposits: { type: 'number' },
    avg_deposit_per_channel: { type: 'number' },
    avg_deposit_per_node: { type: 'number' },
    avg_channels_per_node: { type: 'number' },

    channels: {
      type: 'array',
      items: [
        {
          type: 'object',
          properties: {
            channel_identifier: { type: 'number' },
            status: { type: 'string' },
            participant1: { type: 'string' },
            participant2: { type: 'string' },
            deposit1: { type: 'number' },
            deposit2: { type: 'number' }
          },
          required: [
            'channel_identifier',
            'status',
            'participant1',
            'participant2',
            'deposit1',
            'deposit2'
          ]
        }
      ]
    },

    nodes: {
      type: 'object',
      patternProperties: {
        '^0x[0-9a-fA-F]{40}$': {
          type: 'object',
          properties: {
            opened: { type: 'number' },
            closed: { type: 'number' },
            settled: { type: 'number' }
          },
          required: ['opened', 'closed', 'settled']
        }
      }
    }
  }, // properties

  required: [
    'address',
    'token',
    'num_channels_total',
    'num_channels_opened',
    'num_channels_closed',
    'num_channels_settled',
    'total_deposits',
    'avg_deposit_per_channel',
    'avg_deposit_per_node',
    'avg_channels_per_node',
    'channels',
    'nodes'
  ]
}; // schema
