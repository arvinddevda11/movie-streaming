const mongoose = require('mongoose');
const movieSchema = new mongoose.Schema({
    movieName: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String,
    },
   
    moviedescription: {
        type: String
    },
    movieUrl: {
        type: String, 
        required: true
    },
    isPaid: {
        type: Boolean,
        default: false 
    }
})

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie