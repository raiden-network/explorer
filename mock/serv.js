const fs = require('fs'),
      express = require('express'),
      cors = require('cors');

const app = express(),
      port = 4567;

// Allow all cors (cross domain requests):
app.use(cors());

app.get('/info', (req, res) => {
  res.sendFile('network-info.json', { root: __dirname });
});

app.listen(port, f=>{ console.log(`app listening on port ${port}`) });
