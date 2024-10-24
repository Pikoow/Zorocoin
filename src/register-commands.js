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
                name: 'play',
                description: '50% chance to win 100 zorocoins !',              
    },
    /*{
        name: 'bet',
        description: 'Create a bet and specify two options to wager on.',
        options: [
            {
                name: 'zorocoins',
                description: 'The number of zorocoins you want to bet.',
                type: ApplicationCommandOptionType.Number,
                required: true,
            },
            {
                name: 'title',
                description: 'The title or description of the bet.',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'option1',
                description: 'The first option for the bet.',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'option2',
                description: 'The second option for the bet.',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    }*/
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