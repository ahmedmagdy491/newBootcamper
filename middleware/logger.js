// @desc    Logs requests to Console
const logger = (req,res,next)=>{
    console.log(
        `${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`.magenta
    );
    next()
}

module.exports = logger