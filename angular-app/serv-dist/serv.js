// To be run from parent directory with `node serv-dist/serv.js`

const express = require('express'),
      cors = require('cors');

const app = express(),
      port = 3000;

// Allow all cors (cross domain requests):
app.use(cors());

// Path relative to parent directory:
app.use(express.static('dist/my-app'));
app.use('/home', express.static('dist/my-app'));

app.listen(port, f=>{ console.log(`app listening on port ${port}`) });
