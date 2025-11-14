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
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// === SİSTEM BAŞLANGIÇ ===
client.once("ready", () => {
  client.reklamKorumaAktif = false;
  client.reklamLogKanal = new Map();
  console.log(`${client.user.tag} hazır! Reklam sistemi yüklendi.`);
});

// === REKLAM ENGELLEME ===
const REKLAM_KELIMELERI = [
  "discord.gg", "discord.com/invite", "discordapp.com/invite",
  "http://", "https://", ".com", ".net", ".org", ".xyz", ".tk", ".gg"
];

client.on("messageCreate", async (message) => {
  if (!client.reklamKorumaAktif) return;
  if (message.author.bot || !message.guild || !message.member) return;
  if (message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

  const içerik = message.content.toLowerCase();
  const kullanıcıAdı = message.author.displayName.toLowerCase();

  const embedMetinleri = message.embeds
    .flatMap(e => [e.title, e.description, ...(e.fields?.map(f => f.value) || [])])
    .filter(Boolean)
    .map(s => s.toLowerCase());

  const reklamVar = REKLAM_KELIMELERI.some(k => 
    içerik.includes(k) || kullanıcıAdı.includes(k) || embedMetinleri.some(m => m.includes(k))
  );

  if (!reklamVar) return;

  try { await message.delete(); } catch { return; }

  let uyarı;
  try {
    uyarı = await message.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle("Reklam Engellendi")
        .setDescription(`**${message.author.tag}** reklam yaptı, mesaj silindi.`)
        .setColor(0xff0000)
      ]
    });
    setTimeout(() => uyarı?.delete().catch(() => {}), 3000);
  } catch {}

  const logID = client.reklamLogKanal.get(message.guild.id);
  if (!logID) return;

  const logKanal = message.guild.channels.cache.get(logID);
  if (!logKanal) return;

  try {
    await logKanal.send({
      embeds: [new EmbedBuilder()
        .setTitle("Reklam Yakalandı!")
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "Üye", value: `${message.author} (\`${message.author.id}\`)`, inline: true },
          { name: "Kanal", value: `${message.channel}`, inline: true },
          { name: "Tarih", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
          { name: "İçerik", value: message.content?.slice(0, 1000) || "*Embed*", inline: false }
        )
        .setColor(0xff9900)
        .setFooter({ text: `Mesaj ID: ${message.id}` })
      ],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Mesaja Git")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`)
      )]
    });
  } catch {}
});

///// reklam son
