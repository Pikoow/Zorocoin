const { Client, Interaction } = require('discord.js');
const User = require('../../models/User');
const Cooldown = require('../../models/Cooldown');

const dailyAmount = 1000;

module.exports = {
  name: 'play',
  description: '50% chance to win 100 zorocoins !',

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

      const commandName = 'play';
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      let cooldown = await Cooldown.findOne({ userId, commandName, guildId });

      if (cooldown && Date.now() < cooldown.endsAt) {
        const { default: prettyMs } = await import('pretty-ms');

        await interaction.editReply(
          `You are on cooldown, come back after \`${prettyMs(cooldown.endsAt - Date.now(), {verbose: true})}\``
        );
        return;
      }

      if (!cooldown) {
        cooldown = new Cooldown({ userId, commandName, guildId });
      }

      let user = await User.findOne({ userId });

      if (!user) {
        user = new User({ userId, guildId });
      }

      const zorocoins = 100;

      cooldown.endsAt = Date.now() + 86_400_000;

      const number = Math.floor(Math.random() * 2) + 1;

      if (number == 1) {
        user.balance = user.balance + zorocoins;
        await Promise.all([cooldown.save(), user.save()]);

        await interaction.editReply(
            `YOU WIN ! You received **${zorocoins}** zorocoins! You now have **${user.balance}** zorocoins.`
        );
      } else {
        await Promise.all([cooldown.save(), user.save()]);

        await interaction.editReply(
            `YOU LOSE... You received no zorocoins! You still have **${user.balance}** zorocoins.`
        );
      }
    } catch (error) {
      console.log(`Error with /daily: ${error}`);
    }
  },
};