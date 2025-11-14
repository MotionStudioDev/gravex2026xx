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
    .setName("reklam-engel")
    .setDescription("Reklam engelleme sistemini aç/kapat"),

  async execute(interaction) {
    const isOwner = interaction.guild.ownerId === interaction.user.id;
    const aktif = interaction.client.reklamKorumaAktif;

    if (!isOwner) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle("🚫 Yetki Yok").setDescription("Bu komutu sadece sunucu sahibi kullanabilir.").setColor(0xff0000)],
        ephemeral: true
      });
    }

    if (aktif) {
      const embed = new EmbedBuilder()
        .setTitle("ℹ️ Sistem Zaten Aktif")
        .setDescription("Reklam engelleme sistemi zaten aktif.\n\nKapatmak için aşağıdaki butona bas.")
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
        if (i.customId === "kapat") {
          interaction.client.reklamKorumaAktif = false;
          interaction.client.reklamLogKanal.delete(interaction.guild.id);

          await i.update({
            embeds: [new EmbedBuilder().setTitle("🛑 Sistem Kapatıldı").setColor(0xff0000)],
            components: []
          });
        }
      });

      return;
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

        const kanalSecenekleri = interaction.guild.channels.cache
          .filter(c => c.type === ChannelType.GuildText)
          .map(c => ({ label: c.name, value: c.id }))
          .slice(0, 25);

        const select = new StringSelectMenuBuilder()
          .setCustomId("logsec")
          .setPlaceholder("Log kanalı seç (isteğe bağlı)")
          .addOptions(kanalSecenekleri);

        const row = new ActionRowBuilder().addComponents(select);

        await i.update({
          embeds: [new EmbedBuilder().setTitle("✅ Sistem Aktif").setDescription("İsteğe bağlı olarak log kanalını seçebilirsin.").setColor(0x00bfff)],
          components: [row]
        });
      }

      if (i.customId === "acma") {
        await i.update({
          embeds: [new EmbedBuilder().setTitle("❌ İşlem İptal Edildi").setColor(0xaaaaaa)],
          components: []
        });
      }
    });

    const menuCollector = interaction.channel.createMessageComponentCollector({
      time: 30000,
      filter: i => i.customId === "logsec" && i.user.id === interaction.user.id
    });

    menuCollector.on("collect", async i => {
      const kanalID = i.values[0];
      interaction.client.reklamLogKanal.set(interaction.guild.id, kanalID);

      await i.update({
        embeds: [new EmbedBuilder().setTitle("📌 Log Kanalı Ayarlandı").setDescription(`<#${kanalID}> kanalına log gönderilecek.`).setColor(0x00bfff)],
        components: []
      });
    });
  }
};
