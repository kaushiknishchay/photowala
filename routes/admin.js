var express = require('express');
var passport = require('passport');
var bcrypt = require("bcrypt");
var router = express.Router();
var multer = require('multer');
var mongoose = require('mongoose');
var ExifImage = require('exif').ExifImage;
var thumb = require('node-thumbnail').thumb;
var dbHost = 'mongodb://theleo:th3l30@ds143532.mlab.com:43532/photography';
var db = mongoose.createConnection(dbHost, {useMongoClient: false});//, {useMongoClient: true});
var sync = require('synchronize');
var mongo = require('mongodb').MongoClient;
var url = require('../config/database').url;
var Photo = require('../model/photo');


// var Schema = mongoose.Schema;
//
// var photoSchema = new Schema({
// 	name: String,
// 	collectionName: String,
// 	url: String,
// 	thumb: String,
// 	camera: String,
// 	focal: String,
// 	aperture: String,
// 	exposure: String,
// 	iso: String,
// 	date: String
//
// });
//
// var Photo = mongoose.model('Photo', photoSchema, 'photos');


var Storage = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, "./uploads/");
	},
	filename: function (req, file, callback) {
		callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
	}
});

var upload = multer({
	storage: Storage
}).array("photoFile", 3); //Field name and max count


// SIGNUP ==============================

router.get('/signup', function (req, res, next) {
	res.render('admin/signup', {message: [{}]});
});

router.post('/signup', function (req, res, next) {
	var username = req.body.username;
	var password = req.body.password;

	req.checkBody('username', 'Username required').notEmpty();

	var errors = req.validationErrors();

	if (errors) {
		res.render('admin/signup', {message: errors});
	} else {

		var newUser = {
			username: username,
			password: password
		};

		bcrypt.genSalt(10, function (err, salt) {
			bcrypt.hash(newUser.password, salt, function (err, hash) {
				newUser.password = hash;

				mongo.connect(url, function (err, db) {
					if (err) {
						console.log(err);
						res.send("Error Occurred.");
					} else {
						db.collection('users').find({}).count(function (err, count) {
							if (count === 0) {
								db.collection('users').insertOne(newUser, function (err, result) {
									if (err) {
										console.log(err);
										res.send("Errr");
									}
									db.close();
									res.redirect("/admin")
								});
							} else {
								res.render('admin/signup', {
									message: [{
										msg: "No more users creation allowed."
									}]
								});
							}
						});
					}
				});
			});
		});
	}
});


// LOGIN ==============================

router.get('/login', function (req, res, next) {
	res.render('admin/login',
			{message: req.flash('loginMessage')});
});


router.post('/login', function (req, res, next) {

	var username = req.body.username;
	var password = req.body.password;


	mongo.connect(url, function (err1, db) {

		if (err1) {
			res.send("Err Login Failed");
		} else {

			var cursor = db.collection('users').find({
				username: username
			}).limit(1);

			cursor.count(function (err2, count) {
				console.log(count);
				if (!err2 && count !== 0) {
					cursor.forEach(function (user) {
						bcrypt.compare(password, user.password, function (err3, result) {
							if (result === true) {
								console.log("Success");
								req.session.user = bcrypt.hashSync("nayak", 10);
								req.session.admin = true;
								// console.log(req.session);

								res.redirect('/admin');
							}
						});
					});
				} else {

					res.redirect('/admin/login');
				}
			});
		}
	});

});


// Logout endpoint
router.get('/logout', function (req, res) {

	req.session.destroy();
	res.send("logout success!");
});


// Authentication and Authorization Middleware
var auth = function (req, res, next) {
	if (req.session && req.session.admin && bcrypt.compareSync("nayak", req.session.user)) // true && req.session.admin)
		return next();
	else
		return res.redirect('/admin/login');
};

// HOME ==============================
router.post('/add', auth, function (req, res, next) {

	upload(req, res, function (err) {
		if (err) {
			return res.end("Something went wrong!");
		}
		var filePath = req.files[0].path;

		var newPhoto = new Photo();

		newPhoto.url = filePath;
		newPhoto.name = req.body.photoname;
		newPhoto.collectionName = (req.body.collection === '') ? req.body.collectionName : req.body.collection;

		newPhoto.collectionName = (newPhoto.collectionName === '') ? 'Random' : newPhoto.collectionName;

		try {
			new ExifImage({image: newPhoto.url}, function (error, exifData) {
				if (error)
					console.log('Error: ' + error.message);
				else {
					newPhoto.camera = exifData.image.Make.replace(/[\u0000]/g, '') + ' ' + exifData.image.Model.replace(/[\u0000]/g, '');
					newPhoto.iso = exifData.exif.ISO;
					newPhoto.date = exifData.exif.CreateDate;
					newPhoto.aperture = exifData.exif.ApertureValue;
					newPhoto.exposure = exifData.exif.ExposureCompensation;
					newPhoto.focal = exifData.exif.FocalLength;
				}
			});
		} catch (error) {
			console.log('Error: ' + error.message);
		}

		thumb({
			source: newPhoto.url, // could be a filename: dest/path/image.jpg
			destination: 'uploads/thumb',
			width: 400
		}, function (files, err, stdout, stderr) {
			console.log(files);

			newPhoto.thumb = files[0].dstPath.replace('uploads/', '');
			console.log(newPhoto);

			db.collection('photos').insert(newPhoto).then(function (e, r) {
				console.log(e);
				console.log(r);
			});
		});

		req.flash('msg', 'Photo Uploaded!')

		res.redirect('/admin')
	});

});

router.get('/', auth, function (req, res, next) {

	var collectionArray = [];
	var collPhotos = [];

	db.collection('photos').distinct('collectionName', function (error, names) {
		names.forEach(function (name) {
			collectionArray.push(name);
		});

		var itemP = 0;
		for (var i = 0; i < collectionArray.length; i++) {

			let name = collectionArray[i];
			console.log(i);
			console.log(name);
			var photoArr = [];
			db.collection('photos').find({collectionName: name}).forEach(function (photo) {
				photoArr.push(photo);
				// console.log(i);
			}, function () {
				itemP++;
				collPhotos[name] = photoArr;
				photoArr = [];
				if (itemP >= collectionArray.length) {
					console.log('3546565768r');
					res.render('admin/home', {msg: req.flash('msg'), coll: collectionArray, photoColl: collPhotos});
				}

			});

			// function (err) {
			// 	collPhotos[name] = photoArr;
			// 	console.log('eerrrr');
			//
			// 	if(i===collectionArray.length){
			// 		console.log(i +' '+ name);
			// 	}
			// }

		}


	});


});

module.exports = router;
