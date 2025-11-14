const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  StringSelectMenuBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kufur-engel")
    .setDescription("Küfür engelleme sistemini aç/kapat"),

  async execute(interaction) {
    const client = interaction.client;
    const guildId = interaction.guild.id;
    const isOwner = interaction.guild.ownerId === interaction.user.id;

    if (!client.kufurLogKanal) client.kufurLogKanal = new Map();
    if (!client.kufurEngelAktif) client.kufurEngelAktif = false;

    if (!isOwner) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle("🚫 Yetki Yok")
          .setDescription("Bu komutu sadece sunucu sahibi kullanabilir.")
          .setColor(0xff0000)]
      });
    }

    // ------------ SİSTEM ZATEN AÇIK -----------------
    if (client.kufurEngelAktif) {
      const embed = new EmbedBuilder()
        .setTitle("ℹ️ Sistem Zaten Aktif")
        .setDescription("Küfür engelleme sistemi zaten aktif.\n\nKapatmak için aşağıdaki butona bas.")
        .setColor(0x00bfff);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("kapat").setLabel("🛑 KAPAT").setStyle(ButtonStyle.Danger)
      );

      const msg = await interaction.reply({ embeds: [embed], components: [row] });

      const collector = msg.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 20000
      });

      collector.on("collect", async i => {
        if (i.customId === "kapat") {
          client.kufurEngelAktif = false;
          client.kufurLogKanal.delete(guildId);

          await i.update({
            embeds: [new EmbedBuilder().setTitle("🛑 Sistem Kapatıldı").setColor(0xff0000)],
            components: []
          });
        }
      });

      return;
    }

    // ------------ SİSTEM KAPALI: AÇMA SOR -----------------
    const embed = new EmbedBuilder()
      .setTitle("⚠️ Küfür Engelleme Sistemi")
      .setDescription("Sistemi aktif etmek üzeresin.\n\n**AÇ** → sistemi başlatır\n**AÇMA** → iptal eder")
      .setColor(0xffcc00);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ac").setLabel("✅ AÇ").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("acma").setLabel("❌ AÇMA").setStyle(ButtonStyle.Secondary)
    );

    const msg = await interaction.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 20000
    });

    collector.on("collect", async i => {
      // --- Aç ---
      if (i.customId === "ac") {
        client.kufurEngelAktif = true;

        const kanalSecenekleri = interaction.guild.channels.cache
          .filter(c => c.type === ChannelType.GuildText)
          .map(c => ({ label: c.name, value: c.id }))
          .slice(0, 25);

        const select = new StringSelectMenuBuilder()
          .setCustomId("logsec")
          .setPlaceholder("Log kanalı seç (isteğe bağlı)")
          .addOptions(kanalSecenekleri);

        await i.update({
          embeds: [new EmbedBuilder()
            .setTitle("✅ Sistem Aktif")
            .setDescription("İsteğe bağlı olarak log kanalını seçebilirsin.")
            .setColor(0x00bfff)],
          components: [new ActionRowBuilder().addComponents(select)]
        });

        const msg2 = await i.fetchReply();

        const menuCollector = msg2.createMessageComponentCollector({
          filter: i => i.user.id === interaction.user.id,
          time: 30000
        });

        menuCollector.on("collect", async i => {
          const kanalID = i.values[0];
          client.kufurLogKanal.set(guildId, kanalID);

          await i.update({
            embeds: [new EmbedBuilder()
              .setTitle("📌 Log Kanalı Ayarlandı")
              .setDescription(`<#${kanalID}> kanalına log gönderilecek.`)
              .setColor(0x00bfff)],
            components: []
          });
        });
      }

      // --- Açma ---
      if (i.customId === "acma") {
        await i.update({
          embeds: [new EmbedBuilder().setTitle("❌ İşlem İptal Edildi").setColor(0xaaaaaa)],
          components: []
        });
      }
    });
  }
};
