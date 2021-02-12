const crypto = require('crypto');
const User = require('../models/User');
const sendEmai = require('../utils/sendEmail');
const ErrorResponse = require('../utils/errorResponse');

// @desc    register user
// @route   POST /api/v1/auth/register
// @access  Public

exports.register = async (req, res, next) => {
	const { name, password, email, role } = req.body;

	try {
		const user = await User.create({
			name,
			email,
			password,
			role,
		});

		this.sendTokenResponse(user, 200, res);
	} catch (err) {
		next(err);
	}
};

// @desc    login user
// @route   POST /api/v1/auth/login
// @access  Public

exports.login = async (req, res, next) => {
	const { email, password } = req.body;

	try {
		// Validate email & password
		if (!email || !password) {
			return next(
				new ErrorResponse(`please provide email and password`, 400)
			);
		}

		// check user
		const user = await User.findOne({ email }).select('+password');

		if (!user) {
			return next(new ErrorResponse(`Invalid credentials`, 401));
		}

		// check if passwords matches
		const isMatch = await user.matchPassword(password);

		if (!isMatch) {
			return next(new ErrorResponse(`Invalid credentials`, 401));
		}

		this.sendTokenResponse(user, 200, res);
	} catch (err) {
		next(err);
	}
	
};



// @desc    Log user out
// @route   GET /api/v1/auth/logout
// @access  Private

exports.logout = async (req, res, next) => {
	try {

		res.cookie('token', 'none', {
			expires: new Date(Date.now() + 10 * 1000),
			httpOnly: true
		})

		res.status(200).json({
			success: true,
			data: {},
		});
	} catch (err) {
		next(err);
	}
};

// @desc    Get current logged user
// @route   POST /api/v1/auth/me
// @access  Private

exports.getMe = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id);

		res.status(200).json({
			success: true,
			data: user,
		});
	} catch (err) {
		next(err);
	}
};

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private

exports.updateDetails = async (req, res, next) => {
	try {

		const fieldsToUpdate = {
			name: req.body.name,
			email: req.body.email
		}

		const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
			new: true,
			runValidators: true
		});

		res.status(200).json({
			success: true,
			data: user,
		});
	} catch (err) {
		next(err);
	}
};

// @desc    update password
// @route   POST /api/v1/auth/updatepassword
// @access  Private

exports.updatePassword = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id).select('+password');

		// check current password
		if(!(await user.matchPassword(req.body.currentPassword))) {
			return next(
				new ErrorResponse('Password is incorrect')
			)
		}

		user.password = req.body.newPassword
		await user.save();

		this.sendTokenResponse(user, 200, res)
	} catch (err) {
		next(err);
	}
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public

exports.forgotPassword = async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email });

	if (!user) {
		return next(new ErrorResponse(`There is no user with that email`, 404));
	}

	// Get reset token
	const resetToken = user.getResetPasswordToken();

	await user.save({ validateBeforeSave: false });

	// Create reset url
	const resetUrl = `${req.protocol}://${req.get(
		'host'
	)}/api/v1/resetpassword/${resetToken}`;

	const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

	try {
		await sendEmai({
			email: user.email,
			subject: 'Password Reset Token',
			message,
		});

		res.status(200).json({ success: true, data: 'Email sent' });
	} catch (err) {
		console.log(err);
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;

		await user.save({ validateBeforeSave: false });

		return next(new ErrorResponse('Email not sent', 500));
	}

	res.status(200).json({
		success: true,
		data: user,
	});
};

// @desc    Reset Password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Private

exports.resetPassword = async (req, res, next) => {
	try {
		// Get hashed token
		const resetPasswordToken = crypto
			.createHash('sha256')
			.update(req.params.resettoken)
			.digest('hex');

		const user = await User.findOne({
			resetPasswordToken,
			resetPasswordExpire: { $gt: Date.now() },
		});

		if (!user) {
			return next(new ErrorResponse('Invalid Token', 400));
		}

		// set new password
		user.password = req.body.password;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;
		await user.save();

		this.sendTokenResponse(user, 200, res);
	} catch (err) {
		next(err);
	}
};

// Get token from model, create cookie and send response
exports.sendTokenResponse = (user, statusCode, res) => {
	// create token
	const token = user.getSignedJwtToken();

	const options = {
		expires: new Date(
			Date.now() + process.env.JWT_COKKIE_EXPIRE * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
	};

	if (process.env.NODE_ENV === 'production') {
		options.secure = true;
	}

	res.status(statusCode).cookie('token', token, options).json({
		success: true,
		token,
	});
};



