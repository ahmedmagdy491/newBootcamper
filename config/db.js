const mongoose = require('mongoose');

const connectDB = async()=>{
    const conn = await mongoose.connect(process.env.DB_CONNECTION_URI, 
        {
            useNewUrlParser: true,
            useCreateIndex:true,
            useUnifiedTopology:true,
            useFindAndModify:false
        }
    ).catch(err=> console.log(err));
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold)
}

module.exports = connectDB