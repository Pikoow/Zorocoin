const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  name: 'give',
  description: "Give some zorocoins to another user",
  options: [
    {
      name: 'user',
      description: 'The user who will get the zorocoins.',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'zorocoins',
      description: 'The number of zorocoins you want to give them.',
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

      const giverId = interaction.member.id;
      const receiverId = interaction.options.getUser('user').id;
      const zorocoinsToGive = interaction.options.getNumber('zorocoins');

      if (giverId === receiverId) {
        await interaction.editReply('You cannot give zorocoins to yourself!');
        return;
      }

      // Find the giver and receiver in the database
      const [giver, receiver] = await Promise.all([
        User.findOne({ userId: giverId, guildId: interaction.guild.id }),
        User.findOne({ userId: receiverId, guildId: interaction.guild.id }),
      ]);

      // Check if both users exist
      if (!giver || !receiver) {
        await interaction.editReply(`Both the giver and receiver need to have profiles to complete the transaction.`);
        return;
      }

      // Check if the giver has enough zorocoins
      if (giver.balance < zorocoinsToGive) {
        await interaction.editReply('You do not have enough zorocoins to give.');
        return;
      }

      // Update balances
      giver.balance -= zorocoinsToGive;
      receiver.balance += zorocoinsToGive;

      await Promise.all([giver.save(), receiver.save()]);

      await interaction.editReply(
        `Successfully transferred **${zorocoinsToGive}** zorocoins to ${interaction.options.getUser('user').username}. You now have **${giver.balance}** zorocoins.`
      );
    } catch (error) {
      console.log(`Error with /give: ${error}`);
      await interaction.editReply('An error occurred while processing the transaction.');
    }
  },
};
