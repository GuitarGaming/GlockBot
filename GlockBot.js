const Discord = require('discord.js');
const client = new Discord.Client();
const parser  = require('discord-command-parser');
const Database = require("./db/Database");
const fs = require('fs');
const table = require('text-table');
require('dotenv-defaults').config()
const PREFIX  = '?';
const GLOCKS = [
    "🔫"
];
const KILL_PHRASE = [
    "kill me"
];
const SCORE_TIMER = 10000;
const BACKFIRE_KILLS = 2;
const COMMAND_INFO = JSON.parse(fs.readFileSync("commands-info.json"));

var database = new Database();
// Variable Declaration
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function isGlock(msg) // Checks Messages for Legal Glocks
{
    for(let i=0; i < GLOCKS.length; i++)
    {
        if (msg.content.includes(GLOCKS[i])) return true;
    }
    
    return false;
}
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function glockHandler(msg) // Starts Async for Glock
{
    let guildID = msg.guild.id;        // Server
    let channelID = msg.channel.id;    // Channel
    let userID = msg.member.id;        // User
    let user = await (database.getUser(userID, guildID));
    if (user.status == 0) return;

    database.removeKillRequests(guildID, channelID).then(async (rows) => {
        let killerMember = await msg.guild.fetchMember(userID, true);
        let killerName = killerMember.displayName;
        if (rows && rows.length>0)
        {
            let names = "";
    
            for (let i=0; i<rows.length; i++)
            {   
                $killed = await (database.killUser(rows[i].userID, guildID, killerName));
    
                if ($killed)
                {
                    let member = await msg.guild.fetchMember(rows[i].userID, true);
                    names += member.displayName;
    
                    if (i != rows.length-1)
                    {
                        names += ", ";
                    }
                }
            }

            if (names !== "")
            {
                msg.channel.send(killerName + " 🔫💀 " + names);
            }
        }else{
            let backfires = await (database.backfireUser(userID, guildID));
            let backfireEmojis = "💥".repeat(backfires);
            if (backfires >= BACKFIRE_KILLS)
            {
                $killed = await (database.killUser(userID, guildID, "Backfired!"));

                if ($killed)
                {
                    msg.channel.send(killerName + "'s gun backfired"+ backfireEmojis +"💀");
                }
            }else{
                msg.channel.send(killerName + "'s gun backfired" + backfireEmojis);
            }
        }
    });
}
// -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function isKillPhrase(msg)        // Checks Message for Kill Phrase -> Returns True or False
{
    for(let i=0; i < KILL_PHRASE.length; i++)
    {
        if (msg.content.toLowerCase().includes(KILL_PHRASE[i])) return true;
    }
    
    return false;
}
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function killHandler(msg) // Starts Async for Kill Request
{
    let guildID = msg.guild.id;     // server name
    let channelID = msg.channel.id; // channel name
    let userID = msg.member.id;     // member name
    let user = await (database.getUser(userID, guildID)); // Finds User
    if (user.status == 0) return; // Just ends Function if user is dead
    database.killRequest(userID, guildID, channelID) // stores user channel and server in database

    .then(() => {
        (()=> {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve();
                }, SCORE_TIMER)
            });
        })()
        .then(() => {

            database.deleteKillRequest(userID, guildID, channelID)
            .then((isScore) => {

                if (isScore)
                {
                    database.scoreUser(userID, guildID, 1).then(($score)=>{
                        msg.channel.send(msg.member.displayName + " scored a point!");
                    });
                }
            });
        });
    });
}

const commandHandlers = {  // Command Functions for GlockBot
    "scoreboard": async function(parsed, msg) // Scoreboard and setup
    {
        let rows = await (database.getAllUsers(msg.guild.id));
        console.log('rows' , rows)
        let scoreboard = [["", "Name", "Score", "Backfires", "Status"]];
        console.log('scoreboard' , scoreboard)
        if (rows)
        {
            
            for(let i=0; i<rows.length; i++)
            {
                let row = [];
                let displayName = (await msg.guild.fetchMember(rows[i].userID, true)).displayName;
                let score = rows[i].score;
                let backfires = rows[i].backfires;
                let status = (rows[i].status==1)? "Alive" : "Dead";
                row.push((i + 1) + ".");
                row.push(displayName);
                row.push(score);
                row.push(backfires);
                row.push(status);
                scoreboard.push(row);
            }

            let output = "```" + table(scoreboard, {align: ['l', 'l', 'r', 'r', 'l']}) + "```";
            msg.channel.send(output);
        }
    },
    "reset": async function(parsed, msg) // Resets Scoreboard
    {
        await (database.resetAllUsers(msg.guild.id));
        await (database.clearKillRequest(msg.guild.id));
    },
    "help": async function(parsed, msg) // Lists GlockBot Commands
    {
        let t = [["Command", "Usage", "Desc"]];
        let commands = COMMAND_INFO.commands;
        for (let i in commands)
        {
            let row = [commands[i].command, commands[i].usage, commands[i].description];
            t.push(row);
        }
        let output = "```" + table(t) + "```";
        msg.author.send(output);
    }
}

async function commandHandler(parsed, msg)
{
    if (commandHandlers[parsed.command] !== undefined && typeof commandHandlers[parsed.command] == "function")
    {
        (commandHandlers[parsed.command])(parsed, msg);
    }else{
        msg.channel.send(COMMAND_INFO.errorMessages["unknown"]);
    }
}
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//Events
client.on('ready', () => {
    client.guilds.forEach((value, key, map) => {
        database.createGuildTables(key);
    });
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {  // Listens to Messages in Discord to Figure out proper Function
    if (client.user.id == msg.author.id)
        return;
    
    const parsed = parser.parse(msg, PREFIX);

    if (parsed.success) {  // List Commands
        return commandHandler(parsed, msg);
    }

    if (isKillPhrase(msg)) { // Listens for Kill Requests
        return killHandler(msg);
    }

    if (isGlock(msg)) {  // Listens for Glocks
        return glockHandler(msg);
    }
})

client.on('guildMemberAdd', member => {
    console.log("outside this works");
    if (member.id == client.user.id)
    {
        console.log("this works");

    }
});

//joined a server
client.on("guildCreate", guild => {
    database.createGuildTables(guild.id);
})

//removed from a server
client.on("guildDelete", guild => {
    database.dropGuildTables(guild.id);
})

process.on('exit', function(code) {
    database.close().then(() => {
        client.logout();
    });
});
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
if (process.env.DC_API_TOKEN == undefined || process.env.DC_API_TOKEN == "NjYzNDI2Mjk0OTk4MTA2MTU0.XrhKXg.EgBqp7cDmBqW57hB_0zjGulz_sM")  // Discord Bot Login
{
    console.error("NjYzNDI2Mjk0OTk4MTA2MTU0.XrhKXg.EgBqp7cDmBqW57hB_0zjGulz_sM");
}else{
    database.open().then(() => {
        database.vacuum().then(()=>{
            client.login(process.env.DC_API_TOKEN);
        });
    });
}