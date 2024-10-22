const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');
const Bank = require('../../models/Bank');

module.exports = {
  name: 'addbank',
  description: 'Add money to the bank.',
  options: [
    {
      name: 'zorocoins',
      description: 'The number of zorocoins you want to add.',
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],

  callback: async (client, interaction) => {
    
  },
};