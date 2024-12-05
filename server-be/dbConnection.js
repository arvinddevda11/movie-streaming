const dotenv = require('dotenv').config()
const mongoose = require('mongoose')
function connectDatabase() {
    // const mongoUri = 'mongodb+srv://:cjUfVJhSgNsLkoQh@cluster0.ukqko.mongodb.net/Vidflix?retryWrites=true&w=majority&appName=Cluster0'
const mongoUri=process.env.MONGODB_URI

    mongoose.connect(mongoUri).then(() => {
        console.log("Database is connected")
    })
}

module.exports = {
    connectDatabase
}