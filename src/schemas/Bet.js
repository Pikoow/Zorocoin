const { Schema, model } = require('mongoose');

const betSchema = new Schema({
  guildId: { type: String, required: true },
  creatorId: { type: String, required: true },
  title: { type: String, required: true },
  option1: { type: String, required: true },
  option2: { type: String, required: true },
  bets: {
    option1: [{ userId: String, amount: Number }],
    option2: [{ userId: String, amount: Number }],
  },
  isActive: { type: Boolean, default: true }
});

module.exports = model('Bet', betSchema);
