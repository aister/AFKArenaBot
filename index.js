const {Client} = require('discord.js');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

//card size: 134 x 200
//total size with 5x2: 670 x 400
//padding between cards: 5
//final size: 690 x 405

const config = {
  "token" : process.env.TOKEN,
  "adminID" : "184369428002111488",
  "prefix" : "$"
}
const snek = require('snekfetch');
const client = new Client();

const loadDir = function(url) {
  return new Promise((resolve, reject) => {
    fs.readdir(url, (err, dir) => { 
      resolve([ 
        url.slice(6).toLowerCase(), 
        dir.map(i => { return i.replace('.png', ''); })
      ]); 
    })
  })
}
const randomArray = function(array) {
  let randomized = Math.round(Math.random() * (array.length - 1));
  return array[randomized];
}
fs.readdir('./img', (err, mode) => {
  let folders = [];
  let cooldown = {companion: {}};
  mode = mode.filter(i => { return !i.includes('.'); }).map(folder => {
    folders.push(loadDir(`./img/${folder}/Common`));
    folders.push(loadDir(`./img/${folder}/Rare`));
    folders.push(loadDir(`./img/${folder}/Elite`));
    if (folder == "Normal") cooldown.companion = {};
    cooldown[folder.toLowerCase()] = {};
    return folder.toLowerCase();
  });
  mode.push('companion');
  Promise.all(folders).then(cards => {
    cards = new Map(cards);
    client.on('ready', () => {
      console.log('ready!');
    });

    client.on('message', msg => {
      if (!msg.content.toLowerCase().startsWith(config.prefix)) return;
      let args = msg.content.slice(config.prefix.length).toLowerCase();
      console.log(mode, args, mode.includes(args));
      if (mode.includes(args)) {
        let folder = args.slice(0, 1).toUpperCase() + args.slice(1);
        let canvasSize = [690, 405]
        let timer = 5;
        if (args == "summon" || args == "companion") timer = 3;
        const canvas = createCanvas(...canvasSize);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, ...canvasSize);
        let time = cooldown[args][msg.author.id] - msg.createdTimestamp + (60000 * timer);
        if (time > 0 && msg.author.id != config.adminID) {
          msg.channel.send(`You can only use this command once every ${timer} minutes. You can use it again in ${Math.floor(time / 60000)} minutes ${Math.ceil(time / 1000) % 60} seconds`);
        } else {
          cooldown[args][msg.author.id] = msg.createdTimestamp;
          let result = [...new Array(10)];
          result = result.map((i, index) => {
            i = Math.random();
            if (args != "companion") {
              if (i <= 0.0461) i =  ["Elite", randomArray(cards.get(`${args}/elite`))];
              else if (i <= 0.4831) i =  ["Rare", randomArray(cards.get(`${args}/rare`))];
              else i =  ["Common", randomArray(cards.get(`${args}/common`))];
            } else {
              if (i <= 0.0241) i =  ["Elite", randomArray(cards.get(`summon/elite`))];
              else if (i <= 0.472) i =  ["Rare", randomArray(cards.get(`summon/rare`))];
              else i =  ["Common", randomArray(cards.get(`summon/common`))];
              folder = "Summon";
            }
            if (index < 5) index = [ (index * 139), 0 ];
            else index = [ ((index - 5) * 139), 205 ];
            return new Promise((resolve, reject) => {
              loadImage(`./img/${folder}/${i[0]}/${i[1]}.png`).then(image => {
                ctx.drawImage(image, ...index);
                resolve(i);
              }).catch(reject);
            });
          });
          Promise.all(result).then(r => {
            let rarity = {Common: [], Rare: [], Elite: []};
            r.forEach(i => {
              rarity[i[0]].push(i[1]);
            });
            r = "";
            if (args == "companion") folder = "Companion";
            if (rarity.Common.length) r += `\n#Common\n${rarity.Common.join(', ')}\n`;
            if (rarity.Rare.length) r += `\n#Rare\n${rarity.Rare.join(', ')}\n`;
            if (rarity.Elite.length) r += `\n#Elite\n${rarity.Elite.join(', ')}\n`;
            msg.channel.send(`Here are the 10 ${folder} heroes that you get:\`\`\`md${r}\`\`\``, {file: {attachment: canvas.toBuffer(), name: "result.png"}});
          });
        }
      }
    });
    client.login(config.token);
  });
});