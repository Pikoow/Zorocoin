const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  balance: { type: Number, default: 30 },
});

module.exports = model('User', userSchema);