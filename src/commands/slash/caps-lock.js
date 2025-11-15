const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

let capsLockAktif = false;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("caps-lock")
    .setDescription("Caps Lock engelleme sistemini aç/kapat"),

  async execute(interaction) {
    const client = interaction.client;
    const guildId = interaction.guild.id;

    // Sistem zaten aktifse doğrudan KAPAT seçeneği sun
    if (capsLockAktif) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Sistem Zaten Aktif")
        .setDescription("Caps-Lock sistemi sunucuda aktif durumda!\n\nKapatmak için aşağıdaki butona tıklayın.")
        .setColor(0xffcc00);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("kapat")
          .setLabel("KAPAT")
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
      const msg = await interaction.fetchReply();

      const collector = msg.createMessageComponentCollector({
        time: 20000,
        filter: i => i.user.id === interaction.user.id
      });

      collector.on("collect", async i => {
        if (i.customId === "kapat") {
          await i.update({
            embeds: [new EmbedBuilder().setDescription("⏳ Lütfen bekleyiniz, sistem kapatılıyor...").setColor(0xffcc00)],
            components: []
          });

          setTimeout(() => {
            capsLockAktif = false;
            msg.edit({
              embeds: [new EmbedBuilder().setDescription("✅ Sistem kapatıldı.").setColor(0x00aa00)],
              components: []
            });
          }, 2000);
        }
      });

      return;
    }

    // Sistem kapalıysa: EVET / HAYIR seçenekleri
    const embed = new EmbedBuilder()
      .setTitle("⚠️ Dikkat")
      .setDescription("Caps-Lock sistemi aktif edilmek üzere.\n\nSistemi **açmak** istiyor musunuz?")
      .setColor(0xffcc00);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("evet").setLabel("✅ EVET").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("hayir").setLabel("❌ HAYIR").setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
    const msg = await interaction.fetchReply();

    const collector = msg.createMessageComponentCollector({
      time: 20000,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on("collect", async i => {
      if (i.customId === "hayir") {
        await i.update({
          embeds: [new EmbedBuilder().setDescription("❌ Talebiniz reddedilmiştir.").setColor(0xaaaaaa)],
          components: []
        });
      }

      if (i.customId === "evet") {
        await i.update({
          embeds: [new EmbedBuilder().setDescription("⏳ Lütfen bekleyiniz, sistem aktif ediliyor...").setColor(0xffcc00)],
          components: []
        });

        setTimeout(() => {
          capsLockAktif = true;

          msg.edit({
            embeds: [new EmbedBuilder()
              .setDescription("✅ Sistem sunucuda aktif edildi.\n\nKapatmak istiyorsanız aşağıdaki **KAPAT** butonuna basınız.")
              .setColor(0x00aa00)],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("kapat").setLabel("KAPAT").setStyle(ButtonStyle.Danger)
              )
            ]
          });

          const kapatCollector = msg.createMessageComponentCollector({
            time: 30000,
            filter: i => i.user.id === interaction.user.id
          });

          kapatCollector.on("collect", async i => {
            if (i.customId === "kapat") {
              await i.update({
                embeds: [new EmbedBuilder().setDescription("⏳ Lütfen bekleyiniz, sistem kapatılıyor...").setColor(0xffcc00)],
                components: []
              });

              setTimeout(() => {
                capsLockAktif = false;
                msg.edit({
                  embeds: [new EmbedBuilder().setDescription("✅ Sistem kapatıldı.").setColor(0x00aa00)],
                  components: []
                });
              }, 2000);
            }
          });
        }, 2000);
      }
    });
  }
};
