const mongoose = require('mongoose')
const dotenv = require('dotenv').config()

function connectDatabase() {


    mongoose.connect(mongoUri).then(() => {
        console.log("Database is connected")
    })
}

module.exports = {
    connectDatabase
}