const express = require('express'),
      cors = require('cors');

const app = express(),
      port = 4200;

// Allow all cors (cross domain requests):
app.use(cors());

app.use(express.static('my-app'));
app.use('/home', express.static('my-app'));

app.listen(port, f=>{ console.log(`app listening on port ${port}`) });
