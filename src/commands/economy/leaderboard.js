const { Client, Interaction } = require('discord.js');
const User = require('../../models/User');
const Bank = require('../../models/Bank');

module.exports = {
  name: 'leaderboard',
  description: 'Displays the top 10 users with the most zorocoins',

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

      const topUsers = await User.find({ guildId: interaction.guild.id })
        .sort({ balance: -1 })
        .limit(10);

      const bank = await Bank.find({ guildId: interaction.guild.id });

      if (topUsers.length === 0) {
        await interaction.editReply('No users found in the leaderboard.');
        return;
      }

      const leaderboard = await Promise.all(
        topUsers.map(async (user, index) => {
          const discordUser = await client.users.fetch(user.userId); // Fetch Discord user
          return `${index + 1}. **${discordUser.displayName}** - **${user.balance}** zorocoins`; // Use username instead of userId
        })
      );

      await interaction.editReply(`**Bank**\n${bank.balance}\n**Zorocoins Leaderboard**\n${leaderboard.join('\n')}`);
    } catch (error) {
      console.log(`Error with /leaderboard: ${error}`);
      await interaction.editReply('An error occurred while fetching the leaderboard.');
    }
  },
};
