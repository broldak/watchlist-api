const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
  first_name: String,
  last_name: String,
  email: String,
  password: String,
  movies: [{watched: Boolean, _movie: { type: Schema.Types.ObjectId, ref: 'Movie' }}]
}));
