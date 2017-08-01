const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('Movie', new Schema({
  title: String,
  year: String,
  poster: String,
  imdbid: String
}));
