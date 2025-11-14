const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  StringSelectMenuBuilder,
  PermissionsBitField
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reklam-engel")
    .setDescription("Reklam engelleme sistemini aç/kapat")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    const client = interaction.client;
    const guildId = interaction.guild.id;

    // Sadece sunucu sahibi
    if (interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Yetki Yok")
            .setDescription("Bu komutu sadece **sunucu sahibi** kullanabilir.")
            .setColor(0xff0000)
        ],
        ephemeral: true
      });
    }

    // client değişkenlerini başlat
    if (!client.reklamKorumaAktif) client.reklamKorumaAktif = false;
    if (!client.reklamLogKanal) client.reklamLogKanal = new Map();

    const aktif = client.reklamKorumaAktif;

    // === SİSTEM ZATEN AKTİF ===
    if (aktif) {
      const embed = new EmbedBuilder()
        .setTitle("Sistem Zaten Aktif")
        .setDescription("Reklam engelleme sistemi **aktif**.\n\nKapatmak için butona bas.")
        .setColor(0x00bfff);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("reklam_kapat")
          .setLabel("KAPAT")
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

      return await handleCollector(interaction, "kapat");
    }

    // === SİSTEM KAPALI → AÇMA ===
    const embed = new EmbedBuilder()
      .setTitle("Reklam Engelleme Sistemi")
      .setDescription("Sistemi **aktif etmek** üzeresin.\n\nLog kanalı **isteğe bağlıdır**.")
      .setColor(0xffcc00);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("reklam_ac").setLabel("AÇ").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("reklam_iptal").setLabel("İPTAL").setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    await handleCollector(interaction, "ac");
  }
};

// TEK COLLECTOR YÖNETİM FONKSİYONU
async function handleCollector(interaction, step) {
  const collector = interaction.channel.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id,
    time: step === "ac" ? 30000 : 20000
  });

  collector.on("collect", async i => {
    const client = interaction.client;
    const guildId = interaction.guild.id;

    // KAPAT
    if (i.customId === "reklam_kapat") {
      client.reklamKorumaAktif = false;
      client.reklamLogKanal.delete(guildId);

      await i.update({
        embeds: [new EmbedBuilder().setTitle("Sistem Kapatıldı").setDescription("Reklam engelleme **devre dışı**.").setColor(0xff0000)],
        components: []
      });
      collector.stop();
      return;
    }

    // İPTAL
    if (i.customId === "reklam_iptal") {
      await i.update({
        embeds: [new EmbedBuilder().setTitle("İşlem İptal Edildi").setColor(0xaaaaaa)],
        components: []
      });
      collector.stop();
      return;
    }

    // AÇ
    if (i.customId === "reklam_ac") {
      client.reklamKorumaAktif = true;

      // Botun yazabildiği kanallar
      const kanallar = interaction.guild.channels.cache
        .filter(c =>
          c.type === ChannelType.GuildText &&
          c.permissionsFor(interaction.guild.members.me)?.has([
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ])
        )
        .map(c => ({ label: c.name.slice(0, 100), value: c.id }))
        .slice(0, 24); // 25 - 1 (hiçbiri)

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("reklam_logkanal")
        .setPlaceholder("Log kanalı seç (isteğe bağlı)")
        .addOptions([
          { label: "Log Kanalı Kullanma", value: "none", description: "Log gönderme" },
          ...kanallar
        ]);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await i.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("Sistem Aktif")
            .setDescription("Reklam engelleme **aktif edildi**.\n\nİsteğe bağlı: Log kanalı seç.")
            .setColor(0x00ff00)
        ],
        components: [row]
      });
      return;
    }

    // LOG KANALI SEÇİMİ
    if (i.customId === "reklam_logkanal") {
      const secilen = i.values[0];

      if (secilen === "none") {
        client.reklamLogKanal.delete(guildId);
        await i.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("Log Kapatıldı")
              .setDescription("Log gönderimi **devre dışı**.")
              .setColor(0x00bfff)
          ],
          components: []
        });
      } else {
        client.reklamLogKanal.set(guildId, secilen);
        await i.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("Log Kanalı Ayarlandı")
              .setDescription(`Loglar artık <#${secilen}> kanalına gönderilecek.`)
              .setColor(0x00bfff)
          ],
          components: []
        });
      }
      collector.stop();
    }
  });

  // ZAMAN AŞIMI
  collector.on("end", collected => {
    if (collected.size === 0 || !collected.last()?.deferred) {
      interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Zaman Aşımı")
            .setDescription("İşlem zaman aşımına uğradı.")
            .setColor(0xaaaaaa)
        ],
        components: []
      }).catch(() => {});
    }
  });
}
