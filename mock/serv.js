const fs = require('fs'),
      express = require('express'),
      cors = require('cors');

const app = express(),
      port = 4567;

// Allow all cors (cross domain requests):
app.use(cors());
app.get('/info', (req, res) => {
  res.sendFile('network-info-2.json', { root: __dirname + '/data/' });
  // For testing - tamper with the data to see effect on UI:
  // res.sendFile('network-info-malformed.json', { root: __dirname + '/data/' });
});
app.listen(port, f=>{ console.log(`app listening on path '/info' on port ${port}`) });
