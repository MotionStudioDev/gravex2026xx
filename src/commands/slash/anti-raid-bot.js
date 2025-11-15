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

    client.antiBotRaidAktifGuilds ??= new Map();

    if (client.antiBotRaidAktifGuilds.get(guild.id)) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle("ℹ️ Sistem Zaten Aktif")
          .setDescription("Anti-Raid Bot koruması zaten aktif!\nKapatmak için aşağıdaki **KAPAT** butonuna tıklayın.")
          .setColor(0x00bfff)],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("anti-kapat").setLabel("🛑 KAPAT").setStyle(ButtonStyle.Danger)
        )]
      });
    }

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle("⚠️ Dikkat")
        .setDescription("Anti-Raid Bot koruması açılmak üzere.\nSistemi **aktif etmek** istiyor musunuz?")
        .setColor(0xffcc00)],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("anti-ac").setLabel("✅ EVET").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("anti-iptal").setLabel("❌ HAYIR").setStyle(ButtonStyle.Secondary)
      )]
    });

    const msg = await interaction.fetchReply();

    const collector = msg.createMessageComponentCollector({
      time: 30000,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on("collect", async i => {
      if (i.customId === "anti-iptal") {
        await i.update({
          embeds: [new EmbedBuilder()
            .setDescription("❌ Talebiniz iptal edildi.")
            .setColor(0xaaaaaa)],
          components: []
        });
      }

      if (i.customId === "anti-ac") {
        await i.update({
          embeds: [new EmbedBuilder()
            .setDescription("⏳ Lütfen bekleyin, sistem açılıyor...")
            .setColor(0xffcc00)],
          components: []
        });

        setTimeout(() => {
          client.antiBotRaidAktifGuilds.set(guild.id, true);
          msg.edit({
            embeds: [new EmbedBuilder()
              .setTitle("✅ Sistem Aktif")
              .setDescription("Anti-Raid Bot koruması **aktif edildi**.\nYeni gelen botlar otomatik olarak atılacak.")
              .setColor(0x00aa00)],
            components: [new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("anti-kapat").setLabel("🛑 KAPAT").setStyle(ButtonStyle.Danger)
            )]
          });
        }, 2000);
      }

      if (i.customId === "anti-kapat") {
        await i.update({
          embeds: [new EmbedBuilder()
            .setDescription("⏳ Lütfen bekleyin, sistem kapatılıyor...")
            .setColor(0xffcc00)],
          components: []
        });

        setTimeout(() => {
          client.antiBotRaidAktifGuilds.delete(guild.id);
          msg.edit({
            embeds: [new EmbedBuilder()
              .setTitle("✅ Sistem Kapatıldı")
              .setDescription("Anti-Raid Bot koruması devre dışı bırakıldı.")
              .setColor(0x00aa00)],
            components: []
          });
        }, 2000);
      }
    });
  }
};
