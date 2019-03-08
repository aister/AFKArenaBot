const {Client} = require('discord.js');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas')

//card size: 134 x 200
//total size with 5x2: 670 x 400
//padding between cards: 5
//final size: 690 x 405

const canvasSize = [690, 405]
const canvas = createCanvas(...canvasSize);
const ctx = canvas.getContext('2d');
ctx.fillStyle = "black";
ctx.fillRect(0, 0, ...canvasSize);
const config = {
  "token" : process.env.TOKEN,
  "adminID" : "184369428002111488",
  "prefix" : "$"
}
const snek = require('snekfetch');
const client = new Client();

const loadDir = function(url) {
  return new Promise((resolve, reject) => {
    fs.readdir(url, (err, dir) => { resolve(dir.map(i => { return i.slice(0, -4); })); })
  })
}
const randomArray = function(array) {
  let randomized = Math.round(Math.random() * (array.length - 1));
  return array[randomized];
}
const cooldown = { summon: {}, companion: {} };
const summon1 = function() {

}
Promise.all([ loadDir('./img/Common'), loadDir('./img/Rare'), loadDir('./img/Elite') ]).then(cards => {
  client.on('ready', () => {
    console.log('ready!');
  });

  client.on('message', msg => {
    if (!msg.content.toLowerCase().startsWith(config.prefix)) return;
    let args = msg.content.slice(config.prefix.length).split(' ');
    if (args[0] == "summon" || args[0] == "companion") {
      let time = cooldown[args[0]][msg.author.id] - msg.createdTimestamp + 120000;
      if (args[1] == "10") time += 180000;
      if (time > 0 && msg.author.id != config.adminID) {
        msg.channel.send(`You can only use this command once every ${(args[1] == 10) ? 5 : 2} minutes. You can use it again in ${Math.floor(time / 60000)} minutes ${Math.ceil(time / 1000) % 60} seconds`);
      } else {
        cooldown[args[0]][msg.author.id] = msg.createdTimestamp;
        let result = [""];
        if (args[1] == "10") result = [...new Array(10)];
        result = result.map((i, index) => {
          i = Math.random();
          if (args[0] == "summon") {
            if (i <= 0.0461) i =  ["Elite", randomArray(cards[2])];
            else if (i <= 0.4831) i =  ["Rare", randomArray(cards[1])];
            else i =  ["Common", randomArray(cards[0])];
          } else {
            if (i <= 0.0241) i =  ["Elite", randomArray(cards[2])];
            else if (i <= 0.472) i =  ["Rare", randomArray(cards[1])];
            else i =  ["Common", randomArray(cards[0])];
          }
          if (index < 5) index = [ (index * 139), 0 ];
          else index = [ ((index - 5) * 139), 205 ];
          return new Promise((resolve, reject) => {
            loadImage(`./img/${i[0]}/${i[1]}.png`).then(image => {
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
          if (rarity.Common.length) r += `\n#Common\n${rarity.Common.join(', ')}\n`;
          if (rarity.Rare.length) r += `\n#Rare\n${rarity.Rare.join(', ')}\n`;
          if (rarity.Elite.length) r += `\n#Elite\n${rarity.Elite.join(', ')}\n`;
          msg.channel.send(`The results are in, here are the cards you get:\`\`\`md${r}\`\`\``, {file: {attachment: canvas.toBuffer(), name: "result.png"}});
        });
      }
    }
  });
  client.login(config.token);
});