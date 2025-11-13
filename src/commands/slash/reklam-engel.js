const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  reklamKorumaAktif: false,

  data: new SlashCommandBuilder()
    .setName("reklam-engel")
    .setDescription("Reklam engelleme sistemini aç/kapat"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("⚠️ Reklam Engelleme Sistemi")
      .setDescription("Reklam engelleme sistemini aktif etmek üzeresin.\n\n**AÇ** → sistemi başlatır\n**AÇMA** → iptal eder")
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
      const isOwner = i.guild.ownerId === i.user.id;

      if (i.customId === "ac") {
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

        module.exports.reklamKorumaAktif = true;

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

        module.exports.reklamKorumaAktif = false;

        await i.update({
          embeds: [new EmbedBuilder().setTitle("🛑 Sistem Kapatıldı").setColor(0xff0000)],
          components: []
        });
      }
    });
  }
};
