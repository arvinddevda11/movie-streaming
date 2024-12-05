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
    }
})

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie