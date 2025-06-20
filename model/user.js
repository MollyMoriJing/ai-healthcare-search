const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  preferences: [String],
});

module.exports = mongoose.model('User', userSchema);
