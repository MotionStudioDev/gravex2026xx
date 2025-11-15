const config = require("../config.js")
const { Collection } = require("discord.js")
const ms = require("ms")
const cooldown = new Collection()

module.exports = {
	name: 'messageCreate',
	execute: async(message) => {
  let client = message.client;
  if (message.author.bot) return;
  if (message.channel.type === 'dm') return;
  let prefix = config.prefix
  if(!message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/g); 
  const cmd = args.shift().toLowerCase();
  if(cmd.length == 0 ) return;
  let command = client.commands.get(cmd)
  if(!command) command = client.commands.get(client.commandaliases.get(cmd));

  if(command) {
    if(command.cooldown) {
      if(cooldown.has(`${command.name}${message.author.id}`)) return message.reply({ content: `Bekleme süresi şuan aktif lütfen \`${ms(cooldown.get(`${command.name}${message.author.id}`) - Date.now(), {long : true}).replace("minutes", `dakika`).replace("seconds", `saniye`).replace("second", `saniye`).replace("ms", `milisaniye`)}\` sonra tekrar deneyin.`}).then(msg => setTimeout(() => msg.delete(), cooldown.get(`${command.name}${message.author.id}`) - Date.now()))
      command.run(client, message, args)
      cooldown.set(`${command.name}${message.author.id}`, Date.now() + command.cooldown)
      setTimeout(() => {
        cooldown.delete(`${command.name}${message.author.id}`)
      }, command.cooldown);
  } else {
    command.run(client, message, args)
  }
  }
  }};
////////////////////////
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "messageCreate",

  async execute(message, client) {
    if (!client.capsLockAktif) return;
    if (!message.guild || message.author.bot) return;

    // Yetkili ise işlem yapma
    if (message.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return;

    const content = message.content;
    const letters = content.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ]/g, "");

    if (letters.length < 5) return;

    const upperCount = [...letters].filter(
      h => h === h.toLocaleUpperCase("tr")
    ).length;

    const ratio = upperCount / letters.length;

    if (ratio >= 0.8) {
      await message.delete().catch(() => {});

      const embed = new EmbedBuilder()
        .setTitle("🔇 Büyük Harf Engeli")
        .setDescription(`**${message.author.tag}** tarafından gönderilen mesaj büyük harf içerdiği için silindi.`)
        .setColor(0xffcc00);

      const msg = await message.channel.send({ embeds: [embed] });
      setTimeout(() => msg.delete().catch(() => {}), 2000);
    }
  }
};
