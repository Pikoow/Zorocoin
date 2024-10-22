const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  name: 'balance',
  description: "See your zorocoins",
  options: [
    {
      name: 'user',
      description: 'The user whose balance you want to view.',
      type: ApplicationCommandOptionType.User,
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

    const targetUserId = interaction.options.get('user')?.value || interaction.member.id;
    const guildId = interaction.guild.id;

    await interaction.deferReply();

    const user = await User.findOne({ userId: targetUserId, guildId: guildId });

    if (!user) {
      interaction.editReply(`<@${targetUserId}> doesn't have a balance yet.`);
      return;
    }

    const balance = user.balance;

    interaction.editReply(`You have **${balance}** zorocoins.`);
  }
};