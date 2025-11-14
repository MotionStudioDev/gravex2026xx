const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sil")
    .setDescription("Belirtilen miktarda mesajı siler (onaylı)")
    .addIntegerOption(option =>
      option
        .setName("miktar")
        .setDescription("Silinecek mesaj miktarı")
        .setRequired(true)
    ),

  async execute(interaction) {
    const guild = interaction.guild;
    const user = interaction.user;
    const miktar = interaction.options.getInteger("miktar");

    // sadece sunucu kurucusu
    if (user.id !== guild.ownerId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🚫 Yetki Yetersiz")
            .setDescription("Bu komutu sadece **sunucu sahibi** kullanabilir.")
            .setColor(0xff0000)
        ]
      }).then(msg => {
        setTimeout(() => msg.delete().catch(() => {}), 3000);
      });
    }

    // ✔ ONAY embed'i
    const embed = new EmbedBuilder()
      .setTitle("⚠️ Mesaj Silme Onayı")
      .setDescription(
        `Bu işlem ile **son ${miktar} mesaj silinecektir.**\n` +
        `Bu işlemi gerçekleştirmek istediğinizden **emin misiniz?**`
      )
      .setColor(0xffcc00);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("evet")
        .setLabel("✔ EVET")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("hayir")
        .setLabel("✖ HAYIR")
        .setStyle(ButtonStyle.Danger)
    );

    const msg = await interaction.reply({
      embeds: [embed],
      components: [row]
    });

    // Collector
    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === user.id,
      time: 30000
    });

    collector.on("collect", async i => {
      
      // ❌ HAYIR → REDDEDİLDİ (3 SANİYE SONRA SİL)
      if (i.customId === "hayir") {
        return i.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Talebiniz Reddedildi")
              .setColor(0xaa0000)
          ],
          components: []
        }).then(m => {
          setTimeout(() => m.delete().catch(() => {}), 3000);
        });
      }

      // ✔ EVET → Mesajları Silme
      if (i.customId === "evet") {
        await i.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("🔄 Mesajlar Siliniyor…")
              .setDescription(`**${miktar} mesaj** siliniyor, lütfen bekleyiniz…`)
              .setColor(0xff9900)
          ],
          components: []
        });

        // Mesajları sil
        await interaction.channel.bulkDelete(miktar, true).catch(() => {});

        // 1.2 saniye bekleyip başarı mesajına geçelim
        setTimeout(() => {
          msg.edit({
            embeds: [
              new EmbedBuilder()
                .setTitle("🗑️ İşlem Tamamlandı")
                .setDescription(`Kanalda bulunan **${miktar} mesaj** başarıyla silindi!`)
                .setColor(0x00ff99)
            ]
          }).then(m => {
            setTimeout(() => m.delete().catch(() => {}), 3000); // 3 saniye
          });
        }, 1200);
      }
    });
  }
};
