const {
	getBootcamps,
	createBootcamp,
	getBootcamp,
	updateBootcamp,
	deleteBootcamp,
	getBootcampsInRadius,
	bootcampPhotoUpload
} = require('../controllers/bootcamps');
// Include other resource router
const courseRouter = require('./courses')
const reviewRouter = require('./review')
const errorHandler = require('../middleware/error')
const Bootcamp = require('../models/Bootcamps')


const router = require('express').Router();



const advancedResults = require('../middleware/advancedResults');
const {protect, authorize} = require('../middleware/auth')

// Re-route into other resource route
router.use('/:bootcampId/courses', courseRouter)
router.use('/:bootcampId/reviews', reviewRouter)
router
	.route('/radius/:zipcode/:distance')
	.get(getBootcampsInRadius)

router.route('/:id/photo').put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload)

router
    .route('/')
    .get(advancedResults(Bootcamp, 'courses') , getBootcamps)
    .post(protect, authorize('publisher', 'admin'), createBootcamp)

router
	.route('/:id')
	.get(getBootcamp)
	.put(protect, authorize('publisher', 'admin'),  updateBootcamp)
	.delete(protect, authorize('publisher', 'admin'),  deleteBootcamp);


module.exports = router;
