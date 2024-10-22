require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

        const commands = [
            {
                name: 'addbank',
                description: 'Add money to the bank.',
                options: [
                    {
                        name: 'zorocoins',
                        description: 'The number of zorocoins you want to add.',
                        type: ApplicationCommandOptionType.Number,
                        required: true,
                    },
                ],
            },
            {
                name: 'balance',
                description: "See your zorocoins",
                options: [
                    {
                    name: 'user',
                    description: 'The user whose balance you want to view.',
                    type: ApplicationCommandOptionType.User,
                    },
                ],
            },
            {
                name: 'daily',
                description: 'Collect your dailies!',
            },
            {
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
            },
            {
                name: 'leaderboard',
                description: 'Displays the top 10 users with the most zorocoins',
            },
            {
                name: 'minusbank',
                description: 'Remove money from the bank.',
                options: [
                  {
                    name: 'zorocoins',
                    description: 'The number of zorocoins you want to remove.',
                    type: ApplicationCommandOptionType.Number,
                    required: true,
                  },
                ],
            },
            {
                name: 'play',
                description: '50% chance to win 100 zorocoins !',              
            },
        ];

        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

        (async () => {
          try {
            console.log('Registering slash commands...');
        
            await rest.put(
              Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
              ),
              { body: commands }
            );
        
            console.log('Slash commands were registered successfully!');
          } catch (error) {
            console.log(`There was an error: ${error}`);
          }
        })();