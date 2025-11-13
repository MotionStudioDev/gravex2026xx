const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reklam-engel")
    .setDescription("Reklam engelleme sistemini aç/kapat"),

  async execute(interaction) {
    const isOwner = interaction.guild.ownerId === interaction.user.id;
    const aktif = interaction.client.reklamKorumaAktif;

    // Sistem zaten aktifse: uyarı + KAPAT butonu
    if (aktif) {
      const embed = new EmbedBuilder()
        .setTitle("ℹ️ Sistem Zaten Aktif")
        .setDescription("Bu sunucuda reklam engelleme sistemi zaten aktif durumda.\n\nSistemi kapatmak istiyorsan **KAPAT** butonuna bas.")
        .setColor(0x00bfff);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("kapat").setLabel("🛑 KAPAT").setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

      const collector = interaction.channel.createMessageComponentCollector({
        time: 20000,
        filter: i => i.user.id === interaction.user.id
      });

      collector.on("collect", async i => {
        if (!isOwner) {
          return i.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("🚫 Yetki Yok")
                .setDescription("Bu işlemi sadece sunucu sahibi gerçekleştirebilir.")
                .setColor(0xff0000)
            ],
            ephemeral: true
          });
        }

        if (i.customId === "kapat") {
          interaction.client.reklamKorumaAktif = false;

          await i.update({
            embeds: [new EmbedBuilder().setTitle("🛑 Sistem Kapatıldı").setColor(0xff0000)],
            components: []
          });
        }
      });

      return;
    }

    // Sistem pasifse: AÇ / AÇMA butonları
    if (!isOwner) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🚫 Yetki Yok")
            .setDescription("Bu işlemi sadece sunucu sahibi gerçekleştirebilir.")
            .setColor(0xff0000)
        ],
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("⚠️ Reklam Engelleme Sistemi")
      .setDescription("Sistemi aktif etmek üzeresin.\n\n**AÇ** → sistemi başlatır\n**AÇMA** → iptal eder")
      .setColor(0xffcc00);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ac").setLabel("✅ AÇ").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("acma").setLabel("❌ AÇMA").setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    const collector = interaction.channel.createMessageComponentCollector({
      time: 20000,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on("collect", async i => {
      if (i.customId === "ac") {
        interaction.client.reklamKorumaAktif = true;

        const aktifEmbed = new EmbedBuilder()
          .setTitle("✅ Sistem Aktif")
          .setDescription("Reklam engelleme sistemi aktif edildi!\n\n**KAPAT** → sistemi durdurur")
          .setColor(0x00bfff);

        const kapatRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("kapat").setLabel("🛑 KAPAT").setStyle(ButtonStyle.Danger)
        );

        await i.update({ embeds: [aktifEmbed], components: [kapatRow] });
      }

      if (i.customId === "acma") {
        await i.update({
          embeds: [new EmbedBuilder().setTitle("❌ İşlem İptal Edildi").setColor(0xaaaaaa)],
          components: []
        });
      }

      if (i.customId === "kapat") {
        interaction.client.reklamKorumaAktif = false;

        await i.update({
          embeds: [new EmbedBuilder().setTitle("🛑 Sistem Kapatıldı").setColor(0xff0000)],
          components: []
        });
      }
    });
  }
};
