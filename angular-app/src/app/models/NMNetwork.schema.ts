
export const schema = {
  type: "object",

  properties: {

    token_address: { "type": "string" },
    num_channels_total: { "type": "number" },
    num_channels_opened: { "type": "number" },
    num_channels_closed: { "type": "number" },
    num_channels_settled: { "type": "number" },
    num_nodes: { "type": "number" },

    nodes: { "type": "array", items: [ {"type": "string"} ] },

    channels: { "type": "array", 
      items: [ {
        "type": "object",
        properties: {
          channel_identifier: { "type": "number" },
          status: { "type": "string" },
          participant1: { "type": "string" },
          participant2: { "type": "string" },
          deposit1: { "type": "number" },
          deposit2: { "type": "number" }
        }
      }],
      required: ["channel_identifier", "status", "participant1", "participant2", "deposit1", "deposit2"]
    },

  }, // properties

  required: [ "token_address", "num_channels_total", 
    "num_channels_opened", "num_channels_closed", 
    "num_channels_settled", "num_nodes",
    "nodes", "channels" ]

} // schema
