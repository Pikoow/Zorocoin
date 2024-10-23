require('dotenv').config();
const { Client, IntentsBitField, ActivityType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require('discord.js');const { connect, default: mongoose } = require('mongoose');
const Bank = require('../src/schemas/Bank');
const Cooldown = require('../src/schemas/Cooldown');
const User = require('../src/schemas/User');
const Bet = require('../src/schemas/Bet');

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
      
        interaction.reply(`You have **${balance}** zorocoins.`);
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
      
              await interaction.reply(
                `You are on cooldown, come back after \`${prettyMs(cooldown.endsAt - Date.now(), {verbose: true})}\``
              );
              return;
            }
      
            if (!cooldown) {
              cooldown = new Cooldown({ userId, commandName, guildId });
            }
      
            let user = await User.findOne({ userId, guildId });
      
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
              await interaction.reply('You cannot give zorocoins to yourself!');
              return;
            }
      
            // Find the giver and receiver in the database
            const [giver, receiver] = await Promise.all([
              User.findOne({ userId: giverId, guildId: interaction.guild.id }),
              User.findOne({ userId: receiverId, guildId: interaction.guild.id }),
            ]);
      
            // Check if both users exist
            if (!giver || !receiver) {
              await interaction.reply(`Both the giver and receiver need to have profiles to complete the transaction.`);
              return;
            }
      
            // Check if the giver has enough zorocoins
            if (giver.balance < zorocoinsToGive) {
              await interaction.reply('You do not have enough zorocoins to give.');
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
            await interaction.reply('An error occurred while processing the transaction.');
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
              await interaction.reply('No users found in the leaderboard.');
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
            await interaction.reply('An error occurred while fetching the leaderboard.');
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
          const userId = interaction.user.id;
          const guildId = interaction.guild.id;
          const zorocoins = 50;
  
          let user = await User.findOne({ userId, guildId });
  
          if (!user) {
              user = new User({ userId, guildId });
          }
  
          if (user.balance < zorocoins) {
              await interaction.reply('You do not have enough zorocoins to play.');
              return;
          }
  
          const number = Math.floor(Math.random() * 2) + 1;
  
          if (number === 1) {
              user.balance += zorocoins;
              await Promise.all([user.save()]);
  
              await interaction.reply(
                  `YOU WIN! You received **${zorocoins}** zorocoins! You now have **${user.balance}** zorocoins.`
              );
          } else {
              user.balance -= zorocoins;
              await Promise.all([user.save()]);
  
              await interaction.reply(
                  `YOU LOSE... You lost **${zorocoins}** zorocoins. You now have **${user.balance}** zorocoins.`
              );
          }
      } catch (error) {
          console.log(`Error with /play: ${error}`);
          await interaction.reply('An error occurred while processing the play command.');
      }
    }

    if (interaction.commandName === 'bet') {
      const zorocoins = interaction.options.getNumber('zorocoins');
      const title = interaction.options.getString('title');
      const option1 = interaction.options.getString('option1');
      const option2 = interaction.options.getString('option2');
  
      const bet = new Bet({
        guildId: interaction.guild.id,
        creatorId: interaction.user.id,
        title,
        option1,
        option2,
        bets: { option1: [], option2: [] },
      });
  
      await bet.save();
  
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(`Choose your bet!\n\n1️⃣ ${option1}\n2️⃣ ${option2}`)
        /*.setColor()*/;
  
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bet_option1_${bet.id}`).setLabel(option1).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`bet_option2_${bet.id}`).setLabel(option2).setStyle(ButtonStyle.Primary)
      );
  
      const adminButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bet_win_option1_${bet.id}`).setLabel(`Win ${option1}`).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`bet_win_option2_${bet.id}`).setLabel(`Win ${option2}`).setStyle(ButtonStyle.Success)
      );
  
      await interaction.reply({ embeds: [embed], components: [buttons, adminButtons] });
    }
  
    if (!interaction.isButton()) return;
  
    const [action, option, betId] = interaction.customId.split('_');
  
    if (action === 'bet') {
      const bet = await Bet.findById(betId);
      const userId = interaction.user.id;
  
      if (!bet.isActive) {
        return interaction.reply({ content: 'Betting is closed for this event.', ephemeral: true });
      }
    
      // Fetch user and deduct zorocoins
      const user = await User.findOne({ userId, guildId: interaction.guild.id });
      if (!user || user.balance < zorocoins) {
        return interaction.reply({ content: 'You do not have enough zorocoins.', ephemeral: true });
      }
  
      user.balance -= zorocoins;
      await user.save();
  
      // Add user to the correct bet option
      if (option === 'option1') {
        bet.bets.option1.push({ userId, amount: zorocoins });
      } else {
        bet.bets.option2.push({ userId, amount: zorocoins });
      }
  
      await bet.save();
      await interaction.reply({ content: `You bet **${zorocoins}** zorocoins on ${bet[option]}.`, ephemeral: true });
    }
  
    if (action === 'bet_win') {
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return interaction.reply({ content: 'Only admins can declare the winner.', ephemeral: true });
      }
  
      const bet = await Bet.findById(betId);
      const winningOption = option === 'option1' ? 'option1' : 'option2';
  
      if (!bet.isActive) {
        return interaction.reply({ content: 'This bet has already been closed.', ephemeral: true });
      }
  
      // Calculate the total bet on both sides
      const totalBetOption1 = bet.bets.option1.reduce((acc, cur) => acc + cur.amount, 0);
      const totalBetOption2 = bet.bets.option2.reduce((acc, cur) => acc + cur.amount, 0);
      const totalPool = totalBetOption1 + totalBetOption2;
  
      // Find the winning users and calculate their reward
      const winningBets = bet.bets[winningOption];
      const totalWinningBet = winningBets.reduce((acc, cur) => acc + cur.amount, 0);
  
      for (const winner of winningBets) {
        const user = await User.findOne({ userId: winner.userId, guildId: interaction.guild.id });
        const reward = Math.floor((winner.amount / totalWinningBet) * totalPool);
        user.balance += reward;
        await user.save();
  
        const discordUser = await client.users.fetch(user.userId);
        await discordUser.send(`Congratulations! You won **${reward}** zorocoins from the bet "${bet.title}".`);
      }
  
      bet.isActive = false;
      await bet.save();
  
      await interaction.reply(`Bet "${bet.title}" is closed. ${bet[winningOption]} wins!`);
    }
});