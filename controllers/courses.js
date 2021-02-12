const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamps');
const ErrorResponse = require('../utils/errorResponse');


// @desc    Get all Courses
// @route   Get /api/v1/courses
// @route   Get /api/v1/bootcamps/:bootcampId/courses
// @access  Public

exports.getCourses = async (req, res, next) => {
	try {
		

		if (req.params.bootcampId) {
			const courses = await Course.find({ bootcamp: req.params.bootcampId }).populate({
				path: 'bootcamp',
				select: 'name description'
			});
			return res.status(200).json({
				success: true,
				count: courses.length,
				data: courses
			})
		} else {
			res.status(200).json(res.advancedResults)
		}
		
		
	} catch (err) {
		next(err)
    }
};



// @desc    Get Single Course
// @route   Get /api/v1/courses/:id
// @access  Public

exports.getSingleCourse = async (req, res, next) => {
	try {

		const course = await Course.findById(req.params.id)
		.populate({
			path: 'bootcamp',
			select: 'name description'
		});
		
		if(!course){
			return next( new ErrorResponse(`No Course with ID ${req.params.id}`), 404)
		}

        
        res.status(200).json({
            success: true,
            data: course
		})
		
		
	} catch (err) {
		next(err)
    }
};



// @desc    Add New Course
// @route   POST /api/v1/bootcamps/:bootcampId/courses/
// @access  Private

exports.addCourse = async (req, res, next) => {
	try {

		req.body.bootcamp = req.params.bootcampId;
		req.body.user = req.user.id;

		const bootcamp = await Bootcamp.findById(req.params.bootcampId)
		if (!bootcamp) {
			return next( new ErrorResponse(`No Bootcamp with ID ${req.params.bootcampId}`), 404)
		}

		// Make sure user is bootcamp owner
		if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
			return next(
			  new ErrorResponse(
				`User ${req.user.id} is not authorized to add a course to bootcamp ${bootcamp._id}`,
				401
			  )
			);
		  }

		const course = await Course.create(req.body)

        
        res.status(200).json({
            success: true,
            data: course
		})
		
		
	} catch (err) {
		next(err)
    }
};


// @desc    Update Course
// @route   PUT /api/v1/courses/:id
// @access  Private

exports.updateCourse = async (req, res, next) => {
	try {

		
		let course = await Course.findById(req.params.id)
		if(!course) {
			return next( new ErrorResponse(`No course with id ${req.params.id}`), 404)
		}

		// Make sure user is the owner of course
		if(course.user.toString() !== req.user.id && req.user.role !== 'admin') {
			return next(
				new ErrorResponse(
				  `User ${req.params.id} is not authorized to update this course`,
				  401
				)
			  );
		}
		
		course = await Course.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true
		})
        res.status(200).json({
            success: true,
            data: course
		})
		
		
	} catch (err) {
		next(err)
    }
};


// @desc    Delete Course
// @route   DELETE /api/v1/courses/:id
// @access  Private

exports.deleteCourse = async (req, res, next) => {
	try {

		
		let course = await Course.findById(req.params.id)
		if(!course) {
			return next( new ErrorResponse(`No course with id ${req.params.id}`), 404)
		}

		 // Make sure user is course owner
		 if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
			return next(
			  new ErrorResponse(
				`User ${req.user.id} is not authorized to delete course ${course._id}`,
				401
			  )
			);
		  }
		
		course = await Course.findByIdAndDelete(req.params.id)
        res.status(200).json({
			success: true,
			msg: `course of id ${req.params.id} has been deleted`,
            // data: course
		})
		
		
	} catch (err) {
		next(err)
    }
};