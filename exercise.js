const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  userId: { type: String, ref: 'User' },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);
module.exports = Exercise;