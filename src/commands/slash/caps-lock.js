const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("caps-lock")
    .setDescription("Caps Lock engelleme sistemini aç/kapat"),

  async execute(interaction) {
    const client = interaction.client;
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const isKurucu = interaction.guild.ownerId === interaction.user.id;
    const isYonetici = member?.permissions.has("ManageGuild");

    if (!isKurucu && !isYonetici) {
      const embed = new EmbedBuilder()
        .setTitle("🚫 Yetki Yok")
        .setDescription("Bu komutu sadece **sunucu sahibi** veya **yönetici yetkisine sahip** kişiler kullanabilir.")
        .setColor(0xff0000);

      const reply = await interaction.reply({ embeds: [embed], ephemeral: false });
      setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
      return;
    }

    if (!client.capsLockAktif) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Dikkat")
        .setDescription("Caps-Lock sistemi aktif edilmek üzere.\n\nSistemi açmak istiyor musunuz?")
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
            client.capsLockAktif = true;

            msg.edit({
              embeds: [new EmbedBuilder()
                .setDescription("✅ Sistem sunucuda aktif edildi.\n\nKapatmak istiyorsanız **KAPAT** tuşuna basınız.")
                .setColor(0x00aa00)],
              components: [
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder().setCustomId("kapat").setLabel("🛑 KAPAT").setStyle(ButtonStyle.Danger)
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
                  client.capsLockAktif = false;
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
    } else {
      const embed = new EmbedBuilder()
        .setTitle("ℹ️ Sistem Zaten Aktif")
        .setDescription("Caps-Lock sistemi sunucuda aktif durumda!\n\nKapatmak için aşağıdaki **KAPAT** butonuna tıklayın.")
        .setColor(0x00bfff);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("kapat").setLabel("🛑 KAPAT").setStyle(ButtonStyle.Danger)
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
            client.capsLockAktif = false;
            msg.edit({
              embeds: [new EmbedBuilder().setDescription("✅ Sistem kapatıldı.").setColor(0x00aa00)],
              components: []
            });
          }, 2000);
        }
      });
    }
  }
};
