var express = require('express');
var passport = require('passport');
var bcrypt = require("bcrypt");
var router = express.Router();
var multer = require('multer');

var db = require('../config/database');

// var mongoose = require('mongoose');
var ExifImage = require('exif').ExifImage;
var thumb = require('node-thumbnail').thumb;
// var dbHost = 'mongodb://ds143532.mlab.com:43532/photography';
// var db = mongoose.createConnection(dbHost, {
// 	useMongoClient: false,
// 	// user: 'theleo',
// 	// pass: 'th3l30'
// });//, {useMongoClient: true});

var mongo = require('mongodb').MongoClient;
var url = 'mongodb://localhost/photography';
var Photo = require('../model/photo');
var User = require('../model/users');

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


// Authentication and Authorization Middleware
var auth = function (req, res, next) {
	if (req.session && req.session.admin && bcrypt.compareSync("nayak", req.session.user)) // true && req.session.admin)
		return next();
	else
		return res.redirect('/admin/login');
};


router.get('/remove/:photo_id', auth, function (req, res, next) {

	var photoId = req.params.photo_id;
	console.log(photoId);

	Photo.remove({_id: photoId}, function (err) {
		if (err) return handleError(err);
		req.flash('msg', 'Photo Deleted');
		res.redirect('/admin/');
	});

});


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
			{message: req.flash('emsg')});
});


router.post('/login', function (req, res, next) {

	var username = req.body.username;
	var password = req.body.password;

	User.find({
		username: username,
	}).limit(1).then(function (doc) {
		console.log('------------------= verifying user. =--------------');
		if (doc.length > 0) {
			var adminUser = doc[0];
			let passHash = adminUser.password;
			bcrypt.compare(password, passHash, function (err3, result) {
				if (result === true) {
					req.session.user = bcrypt.hashSync("nayak", 10);
					req.session.admin = true;
					res.redirect('/admin');
				} else {
					req.flash('emsg', 'Invalid Credentials');
					res.redirect('/admin/login');
				}
			});
		} else {
			req.flash('emsg', 'Invalid Credentials');
			res.redirect('/admin/login');
		}
	});

	// mongo.connect(url, function (err1, db) {
	//
	// 	if (err1) {
	// 		res.send("Err Login Failed");
	// 	} else {
	//
	// 		var cursor = db.collection('users').find({
	// 			username: username
	// 		}).limit(1);
	//
	// 		cursor.count(function (err2, count) {
	// 			console.log(count);
	// 			if (!err2 && count !== 0) {
	// 				cursor.forEach(function (user) {
	// 					bcrypt.compare(password, user.password, function (err3, result) {
	// 						if (result === true) {
	// 							console.log("Success");
	// 							req.session.user = bcrypt.hashSync("nayak", 10);
	// 							req.session.admin = true;
	// 							// console.log(req.session);
	//
	// 							res.redirect('/admin');
	// 						}
	// 					});
	// 				});
	// 			} else {
	//
	// 				res.redirect('/admin/login');
	// 			}
	// 		});
	// 	}
	// });

});


// Logout endpoint
router.get('/logout', function (req, res) {

	req.session.destroy();
	res.send("logout success!");
});


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

		req.flash('msg', 'Photo Uploaded!');

		res.redirect('/admin')
	});

});

router.get('/', auth, function (req, res, next) {

	let collectionArray = [];
	let collectionPhotos = [];

	(Photo.find({})).then(function (photos) {

		console.log(photos);

		photos.forEach(function (photo) {
			if (!collectionArray.hasOwnProperty(photo.collectionName)) {
				console.log('createProperty');
				collectionArray.push(photo.collectionName);
				console.log(collectionArray);
				if (collectionPhotos[photo.collectionName] === undefined) {
					collectionPhotos[photo.collectionName] = [];
				}
				collectionPhotos[photo.collectionName].push(photo);

			}
		});

		res.render('admin/home', {msg: req.flash('msg'), coll: collectionArray, photoColl: collectionPhotos});

	});

});

module.exports = router;
