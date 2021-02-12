const path = require('path');
const Bootcamp = require('../models/Bootcamps');
const geocoder = require('../utils/geocoder');
const ErrorResponse = require('../utils/errorResponse');
// @desc    Get all bootcamps
// @route   Get /api/v1/bootcamps
// @access  Public
exports.getBootcamps = async (req, res, next) => {
	try {
		res.status(200).json(res.advancedResults);
	} catch (err) {
		next(err);
	}
};

// @desc    Get all bootcamps
// @route   Get /api/v1/bootcamps/:id
// @access  Public
exports.getBootcamp = async (req, res, next) => {
	try {
		const bootcamp = await Bootcamp.findById(req.params.id);

		res.status(200).json({ success: true, data: bootcamp });
	} catch (err) {
		next(err);
	}
};

// @desc    Create New Bootcamp
// @route   POST /api/v1/bootcamps/
// @access  Private
exports.createBootcamp = async (req, res, next) => {
	try {
		// Add user to req.body
		req.body.user = req.user.id;

		// check for published bootcamp
		const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

		// if the user is not an admin , they can only add only one bootcamp
		if (publishedBootcamp && req.user.role !== 'admin') {
			return next(
				new ErrorResponse(
					`The user Id ${req.user.id} has already published a bootcamp`,
					400
				)
			);
		}

		const bootcamp = await Bootcamp.create(req.body);

		res.status(201).json({
			success: true,
			data: bootcamp,
		});
	} catch (err) {
		next(err);
	}
};

// @desc    Update A bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
exports.updateBootcamp = async (req, res, next) => {
	try {

		let bootcamp = await Bootcamp.findById(req.params.id)

		if (!bootcamp) {
			return next(
				new ErrorResponse(`No bootcamp with id ${req.params.id}`, 404)
			);
		}

		// Make sure user is the owner of bootcamp
		if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
			return next(
				new ErrorResponse(
				  `User ${req.params.id} is not authorized to update this bootcamp`,
				  401
				)
			  );
		}

		bootcamp = await Bootcamp.findByIdAndUpdate(
			req.params.id,
			req.body,
			{
				new: true,
				runValidators: true,
			}
		);
		

		res.status(200).json({ success: true, data: bootcamp });
	} catch (err) {
		next(err);
	}
};

// @desc    Delete bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = async (req, res, next) => {
	try {
		const bootcamp = await Bootcamp.findById(req.params.id);
		if (!bootcamp) {
			return next(
				new ErrorResponse(`No bootcamp with id ${req.params.id}`, 404)
			);
		}

		// Make sure user is the owner of bootcamp
		if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
			return next(
				new ErrorResponse(
				  `User ${req.params.id} is not authorized to update this bootcamp`,
				  401
				)
			  );
		}


		bootcamp.remove();

		res.status(200).json({
			success: true,
			data: {},
			msg: `the element ${req.params.id} has been deleted`,
		});
	} catch (err) {
		next(err);
	}
};

// @desc    Get bootcamps within a radius
// @route   GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access  Private
exports.getBootcampsInRadius = async (req, res, next) => {
	try {
		const { zipcode, distance } = req.params;

		// Get lat/lng from geocoder
		const loc = await geocoder.geocode(zipcode);
		const lat = loc[0].latitude;
		const lng = loc[0].longitude;

		// Calc radius using radians
		// Divide dist by radius of earth
		// radius of earth = 3,963 mi/ 6,378 km
		const EartRadius = 3963;
		const radius = distance / EartRadius;

		const bootcamps = await Bootcamp.find({
			location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
		});

		res.status(200).json({
			success: true,
			count: bootcamps.length,
			data: bootcamps,
		});
	} catch (err) {
		next(err);
	}
};

// @desc    Upload bootcamp photo
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  Private
exports.bootcampPhotoUpload = async (req, res, next) => {
	try {
		const bootcamp = await Bootcamp.findById(req.params.id);

		if (!bootcamp) {
			return next(
				new ErrorResponse(`No bootcamp with id ${req.params.id}`, 404)
			);
		}

		// Make sure user is the owner of bootcamp
		if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
			return next(
				new ErrorResponse(
				  `User ${req.params.id} is not authorized to update this bootcamp`,
				  401
				)
			  );
		}


		if (!req.files) {
			return next(new ErrorResponse(`Please upload a file`, 400));
		}

		const file = req.files.file;
		// Make sure that the image is a photo
		if (!file.mimetype.startsWith('image', null)) {
			return next(new ErrorResponse(`Please upload an image`, 400));
		}

		// check file size
		if (file.size > process.env.MAX_FILE_UPLOAD) {
			return next(
				new ErrorResponse(
					`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
					400
				)
			);
		}

		// Create custom filename
		file.name = `photo_${bootcamp._id}.${path.parse(file.name).ext}`;

		file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
			if (err) {
				console.error(err);
				return next(new ErrorResponse(`Problem with file upload`, 500));
			}

			await Bootcamp.findByIdAndUpdate(req.params.id, {
				photo: file.name,
			});

			res.status(200).json({
				success: true,
				data: file.name,
			});
		});
	} catch (err) {
		next(err);
	}
};
