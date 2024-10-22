const { Schema, model } = require('mongoose');

const bankSchema = new Schema({
  guildId: { type: String, required: true },
  balance: { type: Number, default: 5000 },
});

module.exports = model('Bank', bankSchema);