const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mod-log")
    .setDescription("Mod-Log sistemini başlat/kapat"),

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

    client.modLogAktifGuilds ??= new Map();
    client.modLogKanal ??= new Map();

    const aktifMi = client.modLogAktifGuilds.get(guild.id);
    const kanalVarMi = client.modLogKanal.get(guild.id);

    if (aktifMi && kanalVarMi) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle("ℹ️ Mod-Log Zaten Aktif")
          .setDescription("Mod-Log sistemi zaten aktif!\nKapatmak için aşağıdaki **KAPAT** tuşuna basınız.")
          .setColor(0x00bfff)],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("modlog-kapat").setLabel("🛑 KAPAT").setStyle(ButtonStyle.Danger)
        )]
      });
    }

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle("⚠️ Dikkat")
        .setDescription("Mod-Log sistemi aktif edilmek üzere. Onaylıyor musunuz?")
        .setColor(0xffcc00)],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("modlog-evet").setLabel("✅ EVET").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("modlog-hayir").setLabel("❌ HAYIR").setStyle(ButtonStyle.Secondary)
      )]
    });

    const msg = await interaction.fetchReply();

    const collector = msg.createMessageComponentCollector({
      time: 60000,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on("collect", async i => {
      if (i.customId === "modlog-hayir") {
        await i.update({
          embeds: [new EmbedBuilder()
            .setDescription("❌ Talebiniz iptal edildi.")
            .setColor(0xaaaaaa)],
          components: []
        });
        return;
      }

      if (i.customId === "modlog-evet") {
        await i.update({
          embeds: [new EmbedBuilder()
            .setDescription("⏳ Lütfen bekleyin, mod-log sisteminden cevap bekleniyor...")
            .setColor(0xffcc00)],
          components: []
        });

        setTimeout(() => {
          client.modLogAktifGuilds.set(guild.id, true);

          msg.edit({
            embeds: [new EmbedBuilder()
              .setTitle("✅ Mod-Log Sistemi Aktif Edildi!")
              .setDescription("Mod-Log kayıtlarının gideceği bir kanal ayarla.")
              .setColor(0x00aa00)],
            components: [new ActionRowBuilder().addComponents(
              new ChannelSelectMenuBuilder()
                .setCustomId("modlog-kanal")
                .setPlaceholder("Mod-Log kanalını seçin")
                .addChannelTypes(ChannelType.GuildText)
            )]
          });
        }, 1500);
        return;
      }

      if (i.customId === "modlog-kapat") {
        await i.update({
          embeds: [new EmbedBuilder()
            .setDescription("⏳ Mod-Log kapatılıyor, lütfen bekleyiniz...")
            .setColor(0xffcc00)],
          components: []
        });

        setTimeout(() => {
          client.modLogAktifGuilds.delete(guild.id);
          client.modLogKanal.delete(guild.id);
          msg.edit({
            embeds: [new EmbedBuilder()
              .setDescription("✅ Mod-Log sistemi kapatıldı.")
              .setColor(0x00aa00)],
            components: []
          });
        }, 1500);
        return;
      }

      if (i.customId === "modlog-kanal") {
        const kanalId = i.values[0];
        client.modLogKanal.set(guild.id, kanalId);

        await i.update({
          embeds: [new EmbedBuilder()
            .setDescription("✅ Mod-Log kanalı ayarlandı.\nSistemi kapatmak istiyorsanız **KAPAT** tuşuna basınız.")
            .setColor(0x00aa00)],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("modlog-kapat").setLabel("🛑 KAPAT").setStyle(ButtonStyle.Danger)
          )]
        });
        return;
      }
    });
  }
};
