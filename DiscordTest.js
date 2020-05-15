const Discord = require('discord.js');                // Variable Declaration
const client = new Discord.Client();
const fs = require('fs');
const GLOCKS = [
  "🔫"
];  
var killRequestList = []
var glockRequestList = []  
const glockTimes = [8000, 8200, 8400, 8600, 8800, 9000, 9200, 9400, 9600, 9800, 10000, 10200, 10400, 10600, 10800, 11000]  
const UpdateTimer = 60000
var RawScoreboard = fs.readFileSync('scoreboard.JSON');
var scoreboard = JSON.parse(RawScoreboard)
const regex = /kill(|[*]{2,5}) \1me/gm;
const str = `kill me
kill* me
kill me
kill** me
kill**  me
kill *me
kill** **me
`;
const suicideMessages = [' deleted system32',
' comitted suicide',
', mistakes were made',
' uninstalled life.exe',
' hit themselves in the ankle with a scooter',
' didn\'t enter rappel',
' fucking died, thanks a lot eric',
' got yeeted',
' left The Wheelhouse',
' moved to The Well']
const killMessages = [' glocked :skull_crossbones:',
' killed :skull_crossbones:',
' eradacated :skull_crossbones:',
' headshot :dart:',
' shot :gun:',
' undefined ']
const table = require('text-table');
const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
// Variable Declaration
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);    // Logs in GlockBot and records in console
  let myVar = setInterval(scoreboardWrite , UpdateTimer)
});
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
client.on('message', msg => {
  msgString = msg.content.replace(/[          ​]+/g, "") // removes illegal spaces from string
  if (regex.test(msgString))                          // tests if kill me is in the message
  {
    return killRequest(msg)
  }else if(msg.content.includes(GLOCKS))              //Checks msg for any instance of Legal Glocks
  {
    return glockRequest(msg)
  }else if (msg.content.toLowerCase().includes('kiii') || msg.content.toLowerCase().includes('kiil') || msg.content.toLowerCase().includes('kili') || msg.content.toLowerCase().includes('klll')) 
  {                                                   // Calls person out for Fake Kill Me
    msg.channel.send('Old Trick - Thats an i')
  }else if(msg.content.includes('?scoreboard'))
  {
    return PostScoreboard(msg)
  }
});
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function killRequest(msg)
{
  let guildID = msg.guild.id;                         // server name
  let channelID = msg.channel.id;                     // channel name
  let userID = msg.member.id;                         // member name
  let timestamp = Date.now()                          // timestamp
  let guild = client.guilds.resolve(guildID);         // guild object
  let member = guild.members.resolve(userID);         // memeber obect
  let displayName = member.displayName;               // display name object
  let killRequestInfo = [timestamp , userID , guildID , displayName]
  let playerGlockTime = glockTimes[Math.floor(Math.random()*glockTimes.length)]
  if (killRequestList.hasOwnProperty(channelID) == false) // checks if channel id has been listed in kill requests and creates an element if not (had to fix erics bad code)
  {
    killRequestList[channelID] = [];
  }
  killRequestList[channelID].push(killRequestInfo);   // adds kill request info to list
  await sleep (playerGlockTime);                      // wait the alloted glockTime to check through kill requests for expired requests
  let KillIndex = 0
  killRequestList[channelID].forEach(element => {
    if (Date.now()-killRequestList[channelID][KillIndex][0] >= playerGlockTime) // If more than the alloted glockTime has passed award a point
    {
      msg.reply('scored 2 points');                   // send Point Awarded Message
      msg.channel.send(playerGlockTime)
      killRequestList[channelID].splice(KillIndex,1);
      return awardPoints(userID , displayName , 2)
    }
    KillIndex += 1
  });
}
function glockRequest(msg)
{
  let guildID = msg.guild.id;                         // server name
  let channelID = msg.channel.id;                     // channel name
  let userID = msg.member.id;                         // member name
  let timestamp = Date.now()                          // timestamp
  let guild = client.guilds.resolve(guildID);         
  let member = guild.members.resolve(userID);
  let displayName = member.displayName;
  let glockRequestInfo = [timestamp , userID , guildID , displayName]
  if (glockRequestList[msg.channelID] === undefined)
  {
    glockRequestList[channelID] = [];
  }
  glockRequestList[channelID].push(glockRequestInfo);
  if (killRequestList[channelID] === undefined)       // if channel has never had a kill me request
  {
    msg.channel.send('Dumb ass motherfucker there aint nobody here');
  }else if (killRequestList[channelID] == 0)          // if all kill requests of channel have been resolved
  {
    msg.channel.send('Dumb ass motherfucker there aint nobody here');
  }else if (killRequestList[channelID].length == 1)    // resolves a single kill request
  {
    if (userID == killRequestList[channelID][0][1])
    {
        msg.channel.send(displayName + suicideMessages[Math.floor(Math.random()*suicideMessages.length)]);
        killRequestList[channelID] = []
    }else{                                         
    let Killer = glockRequestList[channelID][0][3]
    let Killed = killRequestList[channelID][0][3]
    msg.channel.send(Killer + killMessages[Math.floor(Math.random()*killMessages.length)] + Killed);
    killRequestList[channelID] = []
    return awardPoints(userID , displayName , 1)      
    }
  }else{                                              // resolves multi kills
    let Killer = glockRequestList[channelID][0][3]
    msg.channel.send(':skull_crossbones: MULTIKILL! :skull_crossbones:');
    msg.channel.send(Killer + ' scored ' + killRequestList[channelID].length + ' points!');
    killRequestList[channelID] = []
    return awardPoints(userID , displayName , killRequestList[channelID].length)
  }
}
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function awardPoints(userID , displayName , pointsAwarded)     // Is called to award points to set display name
{
  let index = 0
  let exists = false
  scoreboard.forEach(element => {
    if (scoreboard[index][0] == userID)
    {
      exists = true
    }
    index += 1
  });
  index = 0
  scoreboard.forEach(element => {
    if (exists == false)
    {
      scoreboard.push([userID , displayName , pointsAwarded])
      exists = true
    }
    if (exists == true && scoreboard[index][0] == userID)
    {
      scoreboard[index][2] += pointsAwarded
      scoreboard[index][1] = displayName
    }
    index += 1
  });
  if (scoreboard.length == 0)
  {
    scoreboard.push(userID , displayName , pointsAwarded)
  }
}
//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function scoreboardWrite()
{ 
  fs.writeFileSync('scoreboard.JSON' , JSON.stringify(scoreboard))
}
function PostScoreboard(msg)
{
  let scoreboardFinal = [["", "Name", "Score"]];
  if (scoreboard)
  {
      
      for(let i=1; i<scoreboard.length; i++)
      {
          let row = [];
          let displayName = scoreboard[i][1]
          let score = scoreboard[i][2]
          row.push((i) + ".");
          row.push(displayName);
          row.push(score);
          scoreboardFinal.push(row);
      }
      scoreboardFinal.sort(function(person1 , person2){
        return person2[1]- person1[2]
      });
      let output = "```" + table(scoreboardFinal, {align: ['l', 'l', 'r', 'r', 'l']}) + "```";
      msg.channel.send(output);
  }
}
client.login('NjYzNDI2Mjk0OTk4MTA2MTU0.XrhKXg.EgBqp7cDmBqW57hB_0zjGulz_sM');