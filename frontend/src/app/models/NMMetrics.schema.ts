export const schema = {
  type: 'object',

  properties: {
    num_token_networks: { type: 'number' },
    num_channels_opened: { type: 'number' },
    num_channels_closed: { type: 'number' },
    num_channels_settled: { type: 'number' },
    num_nodes_with_open_channels: { type: 'number' },
    avg_channels_per_node: { type: 'number' },
    top_nodes_by_channels: {
      type: 'array',
      items: [
        {
          type: 'object',
          properties: {
            address: { type: 'string' },
            channels: { type: 'number' }
          },
          required: ['address', 'channels']
        }
      ]
    }
  }, // properties

  required: [
    'num_token_networks',
    'num_channels_opened',
    'num_channels_closed',
    'num_channels_settled',
    'num_nodes_with_open_channels',
    'avg_channels_per_node',
    'top_nodes_by_channels'
  ]
}; // schema
