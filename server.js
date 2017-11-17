var express = require('express');
var rate = require('./routes/rate');

var app = express();

app.use(express.logger('dev'));
app.use(app.router);
app.use(express.static(__dirname + '/client'));

app.get('/rate/:pair/:tf', rate.saleBuyJudge);

var server = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", () => {
  var addr = server.address();
  console.log(`server listening at ${addr.address}:${addr.port}`);
});

