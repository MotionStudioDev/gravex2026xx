const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const { readdirSync } = require("fs");
const moment = require("moment");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const config = require("./src/config.js");

const token = process.env.TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent
  ],
  shards: "auto",
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Reaction,
    Partials.GuildScheduledEvent,
    Partials.User,
    Partials.ThreadMember
  ]
});

client.commands = new Collection();
client.slashcommands = new Collection();
client.commandaliases = new Collection();

const rest = new REST({ version: "10" }).setToken(token);
const log = x => console.log(`[${moment().format("DD-MM-YYYY HH:mm:ss")}] ${x}`);

// Normal komutlar
const commands = [];
readdirSync("./src/commands/normal").forEach(async file => {
  const command = require(`./src/commands/normal/${file}`);
  if (command) {
    client.commands.set(command.name, command);
    commands.push(command.name, command);
    if (Array.isArray(command.aliases)) {
      command.aliases.forEach(alias => {
        client.commandaliases.set(alias, command.name);
      });
    }
  }
});

// Slash komutlar
const slashcommands = [];
readdirSync("./src/commands/slash").forEach(async file => {
  const command = require(`./src/commands/slash/${file}`);
  slashcommands.push(command.data.toJSON());
  client.slashcommands.set(command.data.name, command);
});

// Bot hazır olduğunda
client.on("ready", async () => {
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: slashcommands }
    );
    log(`${client.user.username} Aktif Edildi!`);
  } catch (error) {
    console.error("Slash komutları yüklenirken hata:", error);
  }
});

// Eventler
readdirSync("./src/events").forEach(async file => {
  const event = require(`./src/events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
});

// Node.js hata yakalama
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);
process.on("uncaughtExceptionMonitor", console.error);

// Express sunucusu (Render için)
const express = require("express");
const app = express();

app.get("/", (req, res) => res.sendStatus(200));
app.listen(process.env.PORT || 3000);

// Botu başlat
client.login(token);

////////reklam 
const { logKanalHaritasi } = require("./commands/slash/reklam-engel");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

client.on("messageCreate", async message => {
  if (!client.reklamKorumaAktif) return;
  if (message.author.bot || !message.guild) return;
  if (message.member.permissions.has("ManageMessages")) return;

  const reklamKelimeleri = ["discord.gg", "http://", "https://", ".com", ".net", ".org", ".xyz", ".tk"];
  const içerik = message.content.toLowerCase();
  const kullanıcıAdı = message.author.username.toLowerCase();

  const reklamVar = reklamKelimeleri.some(kelime =>
    içerik.includes(kelime) || kullanıcıAdı.includes(kelime)
  );

  if (reklamVar) {
    await message.delete().catch(() => {});

    // Uyarı mesajı → reklam yapılan kanala
    const uyarı = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🚫 Reklam Engellendi")
          .setDescription(`**${message.author.tag}** tarafından gönderilen reklam içeriği silindi.`)
          .setColor(0xff0000)
      ]
    }).catch(() => {});
    setTimeout(() => uyarı?.delete().catch(() => {}), 2000);

    // Log kanalı varsa → embed + buton
    const logKanalID = logKanalHaritasi.get(message.guild.id);
    const logKanal = message.guild.channels.cache.get(logKanalID);
    if (logKanal) {
      const logEmbed = new EmbedBuilder()
        .setTitle("🚨 Üye reklam yaparken yakalandı!")
        .addFields(
          { name: "Üye", value: `${message.author.tag} (${message.author.id})`, inline: true },
          { name: "Kanal", value: `${message.channel}`, inline: true },
          { name: "Tarih", value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
        )
        .setColor(0xff9900);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("🔗 Mesaja Git")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}`)
      );

      const logMesaj = await logKanal.send({ embeds: [logEmbed], components: [row] }).catch(() => {});
      setTimeout(() => logMesaj?.delete().catch(() => {}), 2000);
    }
  }
});
///// reklam son
