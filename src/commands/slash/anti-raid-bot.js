const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("anti-raid-bot")
    .setDescription("Bot girişlerine karşı anti-raid korumasını aç/kapat"),

  async execute(interaction) {
    const client = interaction.client;
    const guild = interaction.guild;
    const member = guild.members.cache.get(interaction.user.id);
    const isKurucu = guild.ownerId === interaction.user.id;
    const isYonetici = member?.permissions.has("ManageGuild");

    if (!isKurucu && !isYonetici) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle("🚫 Yetki Yok")
          .setDescription("Bu komutu sadece **sunucu sahibi** veya **yönetici** kullanabilir.")
          .setColor(0xff0000)],
        ephemeral: true
      });
    }

    if (client.antiBotRaidAktifGuilds?.has(guild.id)) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle("ℹ️ Sistem Zaten Aktif")
          .setDescription("Anti-Raid Bot koruması zaten aktif!\nKapatmak için aşağıdaki **KAPAT** butonuna tıklayın.")
          .setColor(0x00bfff)],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("kapat").setLabel("🛑 KAPAT").setStyle(ButtonStyle.Danger)
        )]
      });
    }

    client.antiBotRaidAktifGuilds ??= new Map();
    client.antiBotRaidWhitelist ??= new Map();
    client.antiBotRaidAktifGuilds.set(guild.id, true);

    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle("✅ Sistem Aktif")
        .setDescription("Anti-Raid Bot koruması **aktif edildi**.\nYeni gelen botlar otomatik olarak atılacak.")
        .setColor(0x00aa00)],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("kapat").setLabel("🛑 KAPAT").setStyle(ButtonStyle.Danger)
      )]
    });
  }
};
