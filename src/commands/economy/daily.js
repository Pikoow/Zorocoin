const { Client, Interaction } = require('discord.js');
const User = require('../../models/User');
const Cooldown = require('../../models/Cooldown');

const dailyAmount = 1000;

module.exports = {
  name: 'daily',
  description: 'Collect your dailies!',

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

      const commandName = 'daily';
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      let cooldown = await Cooldown.findOne({ userId, commandName });

      if (cooldown && Date.now() < cooldown.endsAt) {
        const { default: prettyMs } = await import('pretty-ms');

        await interaction.editReply(
          `You are on cooldown, come back after \`${prettyMs(cooldown.endsAt - Date.now(), {verbose: true})}\``
        );
        return;
      }

      if (!cooldown) {
        cooldown = new Cooldown({ userId, commandName });
      }

      let user = await User.findOne({ userId });

      if (!user) {
        user = new User({ userId, guildId });
      }

      const zorocoins = 50;

      user.balance = user.balance + zorocoins;

      cooldown.endsAt = Date.now() + 300_000;
      await Promise.all([cooldown.save(), user.save()]);

      await interaction.editReply(
        `You received **${zorocoins}** zorocoins! You now have **${user.balance}** zorocoins.`
      );
    } catch (error) {
      console.log(`Error with /daily: ${error}`);
    }
  },
};