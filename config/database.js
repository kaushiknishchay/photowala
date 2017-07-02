var mongoose = require('mongoose');
mongoose.set('debug', true);
mongoose.Promise = global.Promise;

var options = {
	useMongoClient: false,
	keepAlive: 1
	// user: 'theleo',
	// pass: 'th3l30'
};

var dbHost = 'mongodb://theleo:th3l30@ds143532.mlab.com:43532/photography';

var dbHostLocal = 'mongodb://localhost:27017/photography';

mongoose.connect(dbHost, options);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
	console.log('connected');
});

module.exports = db;
