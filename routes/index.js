var express = require('express');
var router = express.Router();
var Photo = require('../model/photo');
var dbConnection = require('../config/database');

router.get('/', function (req, res, next) {

	let collectionArray = [];
	let collectionPhotos = [];

	(Photo.find({})).then(function (photos) {
		photos.forEach(function (photo) {
			if (!collectionArray.hasOwnProperty(photo.collectionName)) {
				collectionArray.push(photo.collectionName);
				if (collectionPhotos[photo.collectionName] === undefined) {
					collectionPhotos[photo.collectionName] = [];
				}
				collectionPhotos[photo.collectionName].push(photo);

			}
		});
		res.render('index', {title: 'PhotoWala', photos: collectionPhotos});
	});
});

module.exports = router;
