const ErrorResponse = require("../utils/errorResponse")

const errorHandler  = (err, req, res, next)=>{
    let error = {...err}
    error.message = err.message


    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found`;
        error = new ErrorResponse(message, 404)
    }
    // Mongoose Duplicate Key
    if(err.name === 'MongoError'){
        const message = `Duplicate field value entered`;
        error = new ErrorResponse(message, 400)
    }
    // Mongoose validation errors
    if(err.name === 'ValidationError'){
        const message = Object.values(err.errors).map(value => value.message)
        error = new ErrorResponse(message, 400)
    }
   
    res.status(error.statusCode || 500).json({ 
        success: false,
        error: error.message || 'Internal Server Error'
    })
}



module.exports = errorHandler