const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config()
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});
var moment = require('moment-timezone');

const streamingData = new Map();
const streamingRoleName = 'tester'; // Replace with your streaming role name

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    setInterval(() => {
        resetStreamingData();
    }, 24 * 60 * 60 * 1000); 
});



const streamingCounts = new Map(); // Map to store streaming start and stop counts for each user

client.on('voiceStateUpdate', (oldState, newState) => {
    const member = newState.member;
    const isStreamingBefore = oldState.streaming;
    const isStreamingNow = newState.streaming;

    // Check if the member has the streaming role
    const hasStreamingRole = member.roles.cache.some(role => role.name === streamingRoleName);
    if (hasStreamingRole) {
        let start; // Declare start time variable
        if (!isStreamingBefore && isStreamingNow) {
            // User started streaming
            start = Date.now(); // Capture current time in milliseconds
            streamingData.set(member.id, { startTime: start, displayName: member.displayName }); // Store start time
            incrementStreamingCount(member.id, 'start'); // Increment start count
            member.send(`Stream started!`);
        } else if (isStreamingBefore && !isStreamingNow) {
            // User stopped streaming
            const streamData = streamingData.get(member.id);
            if (streamData) {
                const { startTime, displayName } = streamData;
                const duration = Date.now() - startTime; // Calculate duration using start time
                const formattedDuration = msToTime(duration);
                const targetTextChannel = client.channels.cache.get(process.env.Text_Channel);
                const userId = member.id; // Replace with the actual user ID
                const counts = getStreamingCounts(userId);

                if (targetTextChannel && duration >= 30000) {
                    const pkrtime = moment().format('LT');
                    targetTextChannel.send(`=======================\n**Name:** ${displayName} \n**Streamed Time:** ${formattedDuration} \n**Current time:** ${moment().format('MMMM Do YYYY')} \n**Start Streamed Time:** ${moment(startTime).format('LT')} \n**End Streamed Time:** ${pkrtime} \nStreaming **${counts.start} times** and stopped streaming **${counts.stop + 1} times.**\n=======================\n\n `);
                }
                member.send(`Stream ended. Total time: ${formattedDuration}`);
                streamingData.delete(member.id);
                incrementStreamingCount(member.id, 'stop'); // Increment stop count
            }
        }
    }
});


function incrementStreamingCount(userId, action) {
    const count = streamingCounts.get(userId) || { start: 0, stop: 0 };
    if (action === 'start') {
        count.start++;
    } else if (action === 'stop') {
        count.stop++;
    }
    streamingCounts.set(userId, count);
}

// Function to get streaming counts for a user
function getStreamingCounts(userId) {
    const count = streamingCounts.get(userId) || { start: 0, stop: 0 };
    return count;
}




function resetStreamingData() {
    streamingData.clear();
}

function msToTime(duration) {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}


client.login(process.env.Bot_Tok);
