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
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");

// Reklam kelimeleri (daha akıllı filtre)
const REKLAM_KELIMELERI = [
  "discord.gg", "discord.com/invite", "discordapp.com/invite",
  "http://", "https://",
  ".com", ".net", ".org", ".xyz", ".tk", ".gg", ".me", ".io"
];

client.on("messageCreate", async (message) => {
  // 1. Temel kontroller
  if (!client.reklamKorumaAktif) return;
  if (message.author.bot || !message.guild || !message.member) return;
  if (message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

  // 2. İçerik, kullanıcı adı ve embed'leri topla
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

  // 3. Reklam kontrolü
  const reklamVar = REKLAM_KELIMELERI.some(kelime =>
    içerik.includes(kelime) ||
    kullanıcıAdı.includes(kelime) ||
    embedMetinleri.some(metin => metin.includes(kelime))
  );

  if (!reklamVar) return;

  // 4. Mesajı sil
  try {
    await message.delete();
  } catch (err) {
    console.error(`[REKLAM] Mesaj silinemedi: ${message.id}`, err);
    return;
  }

  // 5. Uyarı mesajı (3 sn sonra silinir)
  let uyarıMesajı;
  try {
    uyarıMesajı = await message.channel.send({
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

  // 6. Log kanalı
  const logKanalID = client.reklamLogKanal?.get(message.guild.id);
  if (!logKanalID) return;

  const logKanal = message.guild.channels.cache.get(logKanalID);
  if (!logKanal) return;

  try {
    const logEmbed = new EmbedBuilder()
      .setTitle("Reklam Yakalandı!")
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Üye", value: `${message.author} (\`${message.author.id}\`)`, inline: true },
        { name: "Kanal", value: `${message.channel}`, inline: true },
        { name: "Tarih", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
        { name: "İçerik", value: message.content?.slice(0, 1000) || "*Embed/attachment*", inline: false }
      )
      .setColor(0xff9900)
      .setFooter({ text: `Mesaj ID: ${message.id}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Mesaja Git")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`)
    );

    await logKanal.send({
      embeds: [logEmbed],
      components: [row]
    });
  } catch (err) {
    console.error(`[REKLAM] Log gönderilemedi: ${logKanalID}`, err);
  }
});
///// reklam son
//////// küfür engel
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

client.on("messageCreate", async message => {
  if (!client.kufurEngelAktif) return;
  if (message.author.bot || !message.guild) return;
  if (!message.member || message.member.permissions.has("ManageMessages")) return;

  const kufurKelimeleri = [
    "amk", "aq", "oç", "piç", "siktir", "sikerim", "sikeyim", "yarrak", "göt", "ananı", "ananı avradını",
    "orospu", "orospu çocuğu", "pezevenk", "kahpe", "mal", "salak", "aptal", "gerizekalı", "embesil",
    "ibne", "ibine", "dallama", "çük", "çükünü", "sikik", "sikimsonik", "sikik herif", "gavat", "kaltak",
    "sürtük", "şerefsiz", "şerefsizlik", "şırfıntı", "top", "travesti", "seks", "sex", "fuck", "fucker",
    "motherfucker", "bitch", "bastard", "dick", "pussy", "slut"
  ];

  const içerik = message.content.toLowerCase();
  const kullanıcıAdı = message.author.username.toLowerCase();

  const kufur = kufurKelimeleri.find(k => içerik.includes(k) || kullanıcıAdı.includes(k));
  if (!kufur) return;

  await message.delete().catch(() => {});

  const uyarı = await message.channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🚫 Küfür Engellendi")
        .setDescription(`**${message.author.tag}** tarafından gönderilen küfürlü mesaj silindi.`)
        .setColor(0xff0000)
    ]
  }).catch(() => {});
  setTimeout(() => uyarı?.delete().catch(() => {}), 2000);

  const logKanalID = client.kufurLogKanal.get(message.guild.id);
  const logKanal = message.guild.channels.cache.get(logKanalID);
  if (logKanal) {
    const logEmbed = new EmbedBuilder()
      .setTitle("🚨 Üye küfür ederken yakalandı!")
      .addFields(
        { name: "Üye", value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: "Kanal", value: `${message.channel}`, inline: true },
        { name: "Tarih", value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false },
        { name: "Küfürlü Mesaj", value: `\`${message.content}\``, inline: false }
      )
      .setColor(0xff9900);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("🔗 Mesaja Git")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}`)
    );

    await logKanal.send({ embeds: [logEmbed], components: [row] }).catch(() => {});
  }
});
///// küüfür son
