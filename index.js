const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require("discord.js");
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
readdirSync("./src/commands/normal").forEach(async file => {
  const command = require(`./src/commands/normal/${file}`);
  if (command) {
    client.commands.set(command.name, command);
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

// Reklam koruma
const REKLAM_KELIMELERI = [
  "discord.gg", "discord.com/invite", "discordapp.com/invite",
  "http://", "https://",
  ".com", ".net", ".org", ".xyz", ".tk", ".gg", ".me", ".io"
];

client.on("messageCreate", async message => {
  if (!client.reklamKorumaAktif) return;
  if (message.author.bot || !message.guild || !message.member) return;
  if (message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

  const içerik = message.content.toLowerCase();
  const kullanıcıAdı = message.author.displayName.toLowerCase();
  const embedMetinleri = message.embeds
    .flatMap(embed => [
      embed.title,
      embed.description,
      embed.footer?.text,
      ...(embed.fields?.map(f => f.value) || [])
    ])
    .filter(Boolean)
    .map(str => str.toLowerCase());

  const reklamVar = REKLAM_KELIMELERI.some(kelime =>
    içerik.includes(kelime) ||
    kullanıcıAdı.includes(kelime) ||
    embedMetinleri.some(metin => metin.includes(kelime))
  );

  if (!reklamVar) return;

  try {
    await message.delete();
  } catch (err) {
    console.error(`[REKLAM] Mesaj silinemedi: ${message.id}`, err);
    return;
  }

  try {
    const uyarıMesajı = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Reklam Engellendi")
          .setDescription(`**${message.author.tag}** tarafından gönderilen reklam silindi.`)
          .setColor(0xff0000)
          .setTimestamp()
      ]
    });
    setTimeout(() => uyarıMesajı?.delete().catch(() => {}), 3000);
  } catch (err) {
    console.error(`[REKLAM] Uyarı gönderilemedi: ${message.channel.id}`, err);
  }
});

// Küfür engel
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;
  const guildId = message.guild.id;
  if (!client.kufurEngelAktif || !client.kufurEngelAktif.get(guildId)) return;

  const kufurler = [
    "amk", "aq", "aQ", "siktir", "orospu", "piç",
    "sik", "yarrak", "amına", "amcık", "göt",
    "mal", "salak", "gerizekalı"
  ];

  const içerik = message.content.toLowerCase();
  if (kufurler.some(k => içerik.includes(k))) {
    try { await message.delete(); } catch (e) {}

    message.channel.send({
      embeds: [
        {
          title: "⚠️ Uyarı",
          description: `${message.author}, bu sunucuda küfür kullanamazsın.`,
          color: 0xffcc00
        }
      ]
    }).then(msg => {
      setTimeout(() => msg.delete().catch(() => {}), 3000);
    });
  }
});

// Anti-raid bot koruması
client.antiBotRaidAktifGuilds = new Map();
client.antiBotRaidWhitelist = new Map();

client.on("guildMemberAdd", async member => {
  const guild = member.guild;
  if (!client.antiBotRaidAktifGuilds.get(guild.id)) return;
  if (!member.user.bot) return;

  const whitelist = client.antiBotRaidWhitelist.get(guild.id) || [];
  if (whitelist.includes(member.user.id)) return;

  try {
    await member.kick("Anti-Raid bot koruması");
  } catch (err) {
    console.error(`Bot kicklenemedi: ${member.user.tag}`, err);
  }

  const embed = new EmbedBuilder()
    .setTitle("🚨 Bot Girişi Engellendi")
    .setDescription(`**${member.user.tag}** adlı bot sunucuya giriş yaptı ve **kicklendi**.\n\nBu botun girişine izin vermek ister misiniz?`)
    .setColor(0xff0000);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`bot-evet-${member.user.id}`).setLabel("✅ EVET").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`bot-hayir-${member.user.id}`).setLabel("❌ HAYIR").setStyle(ButtonStyle.Secondary)
  );

  const yöneticiler = guild.members.cache.filter(m =>
    m.permissions.has("ManageGuild") || m.id === guild.ownerId
  );

  yöneticiler.forEach(async admin => {
    try {
      const msg = await admin.send({ embeds: [embed], components: [row] });

      const collector = msg.createMessageComponentCollector({
        time: 30000,
        filter: i => i.user.id === admin.id
      });

      collector.on("collect", async i => {
        if (i.customId === `bot-evet-${member.user.id}`) {
          await i.update({
            embeds: [new EmbedBuilder().setDescription("⏳ Lütfen bekleyin, gerekli izinler veriliyor...").setColor(0xffcc00)],
            components: []
          });

          setTimeout(() => {
            const wl = client.antiBotRaidWhitelist.get(guild.id) || [];
            wl.push(member.user.id);
            client.antiBotRaidWhitelist.set(guild.id, wl);

            msg.edit({
              embeds: [new EmbedBuilder()
                .setDescription("✅ Sunucuya giriş yapacak botun izinleri aktif edildi!")
                .setColor(0x00aa00)],
              components: []
            });
          }, 2000);
        }

        if (i.customId === `bot-hayir-${member.user.id}`) {
          await i.update({
            embeds: [new EmbedBuilder()
              .setDescription("❌ Bu bot sunucuya tekrar giriş yaparsa otomatik kicklenecek.")
              .setColor(0xff0000)],
            components: []
          });
        }
      });
    } catch (err) {
      console.error(`DM gönderilemedi: ${admin.user.tag}`, err);
    }
  });
});
