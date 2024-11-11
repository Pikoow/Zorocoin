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
await interaction.reply(
              `Zorocoin has been discontinued, thanks for understanding and stay tuned for Zorocoin 2.`
            );
return;
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

await interaction.reply(
              `Zorocoin has been discontinued, thanks for understanding and stay tuned for Zorocoin 2.`
            );
return;
      
        const targetUserId = interaction.options.get('user')?.value || interaction.member.id;
        const guildId = interaction.guild.id;
            
        const user = await User.findOne({ userId: targetUserId, guildId: guildId });

        const member = await interaction.guild.members.fetch(targetUserId);
        const displayName = member.displayName;
      
        if (!user) {
            interaction.reply({
              content: `${displayName} doesn't have a balance yet.`,
              ephemeral: true
            });
            return;
        }
      
        const userBalance = user.balance;

        // Fetch the user's balance in the bank
        const bank = await Bank.findOne({ guildId: guildId });
        if (!bank) {
            interaction.reply("The bank hasn't been initialized yet.");
            return;
        }

        interaction.reply(
          `${displayName} has **${userBalance}** zorocoins in their balance.`
        );
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
await interaction.reply(
              `Zorocoin has been discontinued, thanks for understanding and stay tuned for Zorocoin 2.`
            );
return;
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
      
              await interaction.reply({
                content: `You are on cooldown, come back after \`${prettyMs(cooldown.endsAt - Date.now(), {verbose: true})}\``,
                ephemeral: true
              });
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
await interaction.reply(
              `Zorocoin has been discontinued, thanks for understanding and stay tuned for Zorocoin 2.`
            );
return;
            const giverId = interaction.member.id;
            const receiverId = interaction.options.getUser('user').id;
            const zorocoinsToGive = Math.floor(interaction.options.getNumber('zorocoins'));
      
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

            if(zorocoinsToGive < 0) {
              await interaction.reply('FUCK YOU');
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
await interaction.reply(
              `Zorocoin has been discontinued, thanks for understanding and stay tuned for Zorocoin 2.`
            );
return;
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
await interaction.reply(
              `Zorocoin has been discontinued, thanks for understanding and stay tuned for Zorocoin 2.`
            );
return;
          const userId = interaction.user.id;
          const guildId = interaction.guild.id;
          const zorocoins = interaction.options.getNumber('zorocoins');
  
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
await interaction.reply(
              `Zorocoin has been discontinued, thanks for understanding and stay tuned for Zorocoin 2.`
            );
return;
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
    }

    if (interaction.commandName === 'give_bank') {
await interaction.reply(
              `Zorocoin has been discontinued, thanks for understanding and stay tuned for Zorocoin 2.`
            );
return;
      if (!interaction.inGuild()) {
        interaction.reply({
          content: 'You can only run this command inside a server.',
          ephemeral: true,
        });
        return;
      }
  
      try {
        const userId = interaction.member.id; // Get the user's ID
        const guildId = interaction.guild.id; // Get the guild's ID
        const depositAmount = interaction.options.getNumber('zorocoins'); // Get the number of zorocoins to deposit
  
        if (depositAmount <= 0) {
          await interaction.reply('Please enter a valid number of zorocoins.');
          return;
        }
  
        const user = await User.findOne({ userId, guildId });
        let bank = await Bank.findOne({ guildId });
  
        if (!user) {
          await interaction.reply("You don't have an account yet.");
          return;
        }
  
        if (!bank) {
          bank = new Bank({ guildId });
        }
  
        if (user.balance < depositAmount) {
          await interaction.reply('You do not have enough zorocoins to deposit.');
          return;
        }

        user.balance -= depositAmount; // Deduct from user's balance
        bank.balance += depositAmount; // Add to the bank's total balance
  
        await Promise.all([user.save(), bank.save()]); // Save both user and bank
  
        await interaction.reply(
          `You have successfully transfered **${depositAmount}** zorocoins into the bank. You now have **${user.balance}** zorocoins left.`
        );
      } catch (error) {
        console.log(`Error with /deposit: ${error}`);
        await interaction.reply('An error occurred while processing the deposit.');
      }
    }

    if (interaction.commandName === 'bank_transfer') {
await interaction.reply(
              `Zorocoin has been discontinued, thanks for understanding and stay tuned for Zorocoin 2.`
            );
return;
      if (!interaction.member.permissions.has('Administrator')) {
        interaction.reply({
            content: 'You do not have permission to use this command. Only admins can use it.',
        });
        return;
      }

      if (!interaction.inGuild()) {
        interaction.reply({
          content: 'You can only run this command inside a server.',
          ephemeral: true,
        });
        return;
      }
  
      try {
        const userId = interaction.options.getUser('user').id; // Get the user's ID
        const guildId = interaction.guild.id; // Get the guild's ID
        const depositAmount = interaction.options.getNumber('zorocoins');
  
        if (depositAmount <= 0) {
          await interaction.reply('Please enter a valid number of zorocoins.');
          return;
        }
  
        const user = await User.findOne({ userId, guildId });
        let bank = await Bank.findOne({ guildId });
  
        if (!user) {
          await interaction.reply("You don't have an account yet.");
          return;
        }
  
        if (!bank) {
          bank = new Bank({ guildId });
        }
  
        if (bank.balance < depositAmount) {
          await interaction.reply('You do not have enough zorocoins in the bank to transfer.');
          return;
        }

        user.balance += depositAmount; // Deduct from user's balance
        bank.balance -= depositAmount; // Add to the bank's total balance
  
        await Promise.all([user.save(), bank.save()]); // Save both user and bank

        const member = await interaction.guild.members.fetch(receiverId);
        const displayName = member.displayName;
  
        await interaction.reply(
          `You have successfully transfered **${depositAmount}** zorocoins to ${displayName}. The bank has **${bank.balance}** zorocoins left.`
        );
      } catch (error) {
        console.log(`Error with /deposit: ${error}`);
        await interaction.reply('An error occurred while processing the deposit.');
      }
    }

    
});