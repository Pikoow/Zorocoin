const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');
const Bank = require('../../models/Bank');

module.exports = {
  name: 'addBank',
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
    if (!interaction.inGuild()) {
      interaction.reply({
        content: 'You can only run this command inside a server.',
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply();

      const guildId = interaction.guild.id;

      let bank = await Bank.findOne({ guildId: guildId });

      if (!bank) {
        bank = new Bank({ guildId: guildId });
      }

      const amount = interaction.options.getNumber('zorocoins');

      bank.balance = bank.balance + amount;

      await Promise.all([bank.save()]);

      await interaction.editReply(
        `Added **${amount}** zorocoins to the bank.`
      );
    } catch (error) {
      console.log(`Error with /daily: ${error}`);
    }
  },
};