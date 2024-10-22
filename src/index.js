require('dotenv').config();
const { Client, IntentsBitField, EmbedBuilder, ActivityType, ApplicationCommandOptionType, Interaction } = require('discord.js');
const { connect, default: mongoose } = require('mongoose');
const Bank = require('../src/schemas/Bank');
const Cooldown = require('../src/schemas/Cooldown');
const User = require('../src/schemas/User');

const dailyAmount = 5;

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
            const guildId = interaction.guild.id;
      
            let bank = await Bank.findOne({ guildId: guildId });
      
            if (!bank) {
              bank = new Bank({ guildId: guildId });
            }
      
            const amount = interaction.options.getNumber('zorocoins');
      
            bank.balance = bank.balance + amount;
      
            await Promise.all([bank.save()]);
      
            await interaction.reply(
              `Added **${amount}** zorocoins to the bank.`
            );
          } catch (error) {
            console.log(`Error with /daily: ${error}`);
          }
    }

    if (interaction.commandName === "balance") {
        if (!interaction.inGuild()) {
            interaction.reply({
              content: 'You can only run this command inside a server.',
              ephemeral: true,
            });
            return;
        }
      
        const targetUserId = interaction.options.get('user')?.value || interaction.member.id;
        const guildId = interaction.guild.id;
            
        const user = await User.findOne({ userId: targetUserId, guildId: guildId });
      
        if (!user) {
            interaction.reply(`<@${targetUserId}> doesn't have a balance yet.`);
            return;
        }
      
        const balance = user.balance;
      
        interaction.editReply(`You have **${balance}** zorocoins.`);
    }

    if (interaction.commandName === "daily") {
        if (!interaction.inGuild()) {
            interaction.reply({
              content: 'You can only run this command inside a server.',
              ephemeral: true,
            });
            return;
          }
      
          try {      
            const commandName = 'daily';
            const userId = interaction.user.id;
            const guildId = interaction.guild.id;
      
            let cooldown = await Cooldown.findOne({ userId, commandName, guildId });
      
            let bank = await Bank.findOne({ guildId: guildId });
      
            if (!bank) {
              bank = new Bank({ guildId: guildId });
            }
      
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
      
            user.balance = user.balance + dailyAmount;
      
            bank.balance = bank.balance - dailyAmount;
      
            cooldown.endsAt = Date.now() + 86_400_000;
            await Promise.all([cooldown.save(), user.save(), bank.save()]);
      
            await interaction.reply(
              `You received **${dailyAmount}** zorocoins! You now have **${user.balance}** zorocoins.`
            );
          } catch (error) {
            console.log(`Error with /daily: ${error}`);
          }
    }

    if (interaction.commandName === "give") {
        if (!interaction.inGuild()) {
            interaction.reply({
              content: 'You can only run this command inside a server.',
              ephemeral: true,
            });
            return;
          }
      
          try {      
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
      
            await interaction.reply(
              `Successfully transferred **${zorocoinsToGive}** zorocoins to ${interaction.options.getUser('user').username}. You now have **${giver.balance}** zorocoins.`
            );
          } catch (error) {
            console.log(`Error with /give: ${error}`);
            await interaction.editReply('An error occurred while processing the transaction.');
          }
    }

    if (interaction.commandName === "leaderboard") {
        if (!interaction.inGuild()) {
            interaction.reply({
              content: 'You can only run this command inside a server.',
              ephemeral: true,
            });
            return;
          }
      
          try {      
            const topUsers = await User.find({ guildId: interaction.guild.id })
              .sort({ balance: -1 })
              .limit(10);
      
            const bank = await Bank.findOne({ guildId: interaction.guild.id });
      
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
      
            await interaction.reply(`**Bank**\n${bank.balance}\n**Zorocoins Leaderboard**\n${leaderboard.join('\n')}`);
          } catch (error) {
            console.log(`Error with /leaderboard: ${error}`);
            await interaction.editReply('An error occurred while fetching the leaderboard.');
          }
    }

    if (interaction.commandName === "play") {
        if (!interaction.inGuild()) {
            interaction.reply({
              content: 'You can only run this command inside a server.',
              ephemeral: true,
            });
            return;
          }
      
          try {      
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
      
            const zorocoins = 50;
      
            cooldown.endsAt = Date.now() + 86_400_000;
      
            const number = Math.floor(Math.random() * 2) + 1;
      
            if (number == 1) {
              user.balance = user.balance + zorocoins;
              await Promise.all([cooldown.save(), user.save()]);
      
              await interaction.reply(
                  `YOU WIN ! You received **${zorocoins}** zorocoins! You now have **${user.balance}** zorocoins.`
              );
            } else {
              user.balance = user.balance - zorocoins;
              await Promise.all([cooldown.save(), user.save()]);
      
              await interaction.reply(
                  `YOU LOSE... You received no zorocoins! You still have **${user.balance}** zorocoins.`
              );
            }
          } catch (error) {
            console.log(`Error with /daily: ${error}`);
          }
    }
});