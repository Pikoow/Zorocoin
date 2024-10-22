require('dotenv').config();
const { Client, IntentsBitField, EmbedBuilder, ActivityType, ApplicationCommandOptionType, Interaction } = require('discord.js');
const { connect, default: mongoose } = require('mongoose');
const Bank = require('../src/schemas/Bank');
const Cooldown = require('../src/schemas/Cooldown');
const User = require('../src/schemas/User');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

(async () => {
    await connect(process.env.MONGODB_ID).catch(console.error);
    client.login(process.env.TOKEN);
})();

client.on('ready', async (c) => {
    client.user.setActivity({
        name: 'Fuck the british',
        type: ActivityType.Playing,
    });

    console.log(`${c.user.tag} is ready.`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "addbank") {
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
    }
});