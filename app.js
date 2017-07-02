var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var mongodb = require('mongodb');
var expressValidator = require('express-validator');
// var dbConnection = require('./config/database');


var index = require('./routes/index');
var admin = require('./routes/admin');

//initializing app
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/img')));
app.use(express.static(path.join(__dirname, 'uploads')));

// app.use(expressThumbnail.register(__dirname + '/uploads'));

// Setup session and passport

app.use(session({
	secret: 'sdIU@N^&^dAKG^&sb@^&',
	saveUninitialized: true,
	resave: true
}));

//
// app.use(passport.initialize());
// app.use(passport.session());


//
app.use(expressValidator({
	errorFormatter: function (param, msg, value) {
		var namespace = param.split('.')
				, root = namespace.shift()
				, formParam = root;
		while (namespace.length) {
			formParam += '[' + namespace.shift() + ']';
		}
		return {
			param: formParam,
			msg: msg,
			value: value
		};
	}
}));


//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(flash());

app.use(function (req, res, next) {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	next();
});


//The routes mapping


app.use('/', index);
app.use('/admin', admin);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
