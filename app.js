const path = require('path')
const express = require('express');
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const colors = require('colors')
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')
const errorHandler = require('./middleware/error')
// Middlewares
const logger = require('./middleware/logger')
// Load env vars

dotenv.config({path: './config/config.env'})

// Connect To DB
connectDB();

//Routes
const bootcampsRoutes = require('./routes/bootcamps')
const coursesRoutes = require('./routes/courses')
const authRoutes = require('./routes/auth')
const usersRoutes = require('./routes/users')
const reviewsRoutes = require('./routes/review')


const app = express();


// Body Parser
app.use(express.json());

// Cookie Parser
app.use(cookieParser());

app.use(logger);

// File uploadinf
app.use(fileupload());

// Sanitize Data
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Set security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 Mins
    max: 100
})

app.use(limiter);
// Prevent http polution
app.use(hpp());

// Enable CORS
app.use(cors());

// set static folder
app.use(express.static(path.join(__dirname, 'public')));

//Mount Routers
app.use('/api/v1/bootcamps', bootcampsRoutes);
app.use('/api/v1/courses',coursesRoutes);
app.use('/api/v1/auth',authRoutes);
app.use('/api/v1/auth/users',usersRoutes);
app.use('/api/v1/reviews',reviewsRoutes);
app.use(errorHandler);

//listen
const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});

// Handle Unhandle promise rejections
process.on('unhandledRejection', ( err, promise )=>{
    console.log(`Error: ${err.message}`.red)
    // Close server & exit process
    server.close(()=> process.exit(1))
})