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
      const embed = new EmbedBuilder()
        .setTitle("🚫 Yetki Yok")
        .setDescription("Bu komutu sadece **sunucu sahibi** veya **yönetici yetkisine sahip** kişiler kullanabilir.")
        .setColor(0xff0000);

      const reply = await interaction.reply({ embeds: [embed], ephemeral: false });
      setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
      return;
    }

    if (!client.antiBotRaidAktif) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Dikkat")
        .setDescription("Bot koruması aktif edilmek üzere.\n\nSistemi açmak istiyor musunuz?")
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
            embeds: [new EmbedBuilder().setDescription("❌ Talebiniz iptal edildi.").setColor(0xaaaaaa)],
            components: []
          });
        }

        if (i.customId === "evet") {
          await i.update({
            embeds: [new EmbedBuilder().setDescription("⏳ Lütfen bekleyiniz, sistem açılıyor...").setColor(0xffcc00)],
            components: []
          });

          setTimeout(() => {
            client.antiBotRaidAktif = true;
            msg.edit({
              embeds: [new EmbedBuilder()
                .setDescription("✅ Bot koruması aktif edildi.\nYeni gelen botlar otomatik olarak atılacak.")
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
                  client.antiBotRaidAktif = false;
                  msg.edit({
                    embeds: [new EmbedBuilder().setDescription("✅ Bot koruması kapatıldı.").setColor(0x00aa00)],
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
        .setDescription("Bot koruması zaten aktif!\nKapatmak için aşağıdaki **KAPAT** butonuna tıklayın.")
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
            client.antiBotRaidAktif = false;
            msg.edit({
              embeds: [new EmbedBuilder().setDescription("✅ Bot koruması kapatıldı.").setColor(0x00aa00)],
              components: []
            });
          }, 2000);
        }
      });
    }
  }
};
