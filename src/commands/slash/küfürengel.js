const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kufur-engel")
    .setDescription("Küfür engelleme sistemini aç/kapat"),

  async execute(interaction) {
    const client = interaction.client;
    const guild = interaction.guild;
    const guildId = guild.id;

    // Mapler yoksa oluştur
    if (!client.kufurEngelAktif) client.kufurEngelAktif = new Map();
    if (!client.kufurLogKanal) client.kufurLogKanal = new Map();

    // Yetki kontrolü
    if (interaction.user.id !== guild.ownerId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🚫 Yetkin Yetersiz")
            .setDescription("Bu komutu sadece **sunucu sahibi** kullanabilir.")
            .setColor(0xff0000)
        ]
      });
    }

    // Sistem zaten aktifse kapatma ekranı
    if (client.kufurEngelAktif.get(guildId)) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Sistem Zaten Aktif")
        .setDescription("Küfür engelleme sistemi zaten açık.\n\nKapatmak için aşağıdaki butona tıklayın.")
        .setColor(0x00bfff);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("kapat")
          .setLabel("🛑 KAPAT")
          .setStyle(ButtonStyle.Danger)
      );

      const msg = await interaction.reply({ embeds: [embed], components: [row] });

      const collector = msg.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 30000
      });

      collector.on("collect", async i => {
        if (i.customId === "kapat") {
          await i.update({
            embeds: [
              new EmbedBuilder()
                .setTitle("🔄 Sistem Kapatılıyor…")
                .setDescription("Lütfen bekleyiniz…")
                .setColor(0xff9900)
            ],
            components: []
          });

          setTimeout(async () => {
            client.kufurEngelAktif.set(guildId, false);
            client.kufurLogKanal.delete(guildId);

            await msg.edit({
              embeds: [
                new EmbedBuilder()
                  .setTitle("🛑 Sistem Kapatıldı")
                  .setColor(0xff0000)
              ]
            });
          }, 2000);
        }
      });

      return;
    }

    // Sistem kapalı → açma ekranı
    const embed = new EmbedBuilder()
      .setTitle("⚠️ Dikkat")
      .setDescription("Küfür engelleme sistemini açmak üzeresiniz.\n\nEmin misiniz?")
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

    const msg = await interaction.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 30000
    });

    collector.on("collect", async i => {
      if (i.customId === "hayir") {
        return i.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Talep Reddedildi")
              .setColor(0xaa0000)
          ],
          components: []
        });
      }

      if (i.customId === "evet") {
        client.kufurEngelAktif.set(guildId, true);

        const embed2 = new EmbedBuilder()
          .setTitle("✅ Sistem Aktif Edildi")
          .setDescription("Sistem başarıyla açıldı.\n\nİsteğe bağlı olarak bir **log kanalı** seçebilirsiniz.\n\nKapatmak isterseniz aşağıdaki **KAPAT** tuşuna basın.")
          .setColor(0x00ff99);

        // Log kanal seçenekleri
        const channelOptions = guild.channels.cache
          .filter(c => c.type === ChannelType.GuildText)
          .map(c => ({ label: c.name, value: c.id }))
          .slice(0, 25);

        const select = new StringSelectMenuBuilder()
          .setCustomId("logsec")
          .setPlaceholder("Log kanalı seç (opsiyonel)")
          .addOptions(channelOptions);

        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("kapat")
            .setLabel("🛑 KAPAT")
            .setStyle(ButtonStyle.Danger)
        );

        const rowSelect = new ActionRowBuilder().addComponents(select);

        await i.update({
          embeds: [embed2],
          components: [row2, rowSelect]
        });

        // Menü collector
        const menuCollector = msg.createMessageComponentCollector({
          filter: i => i.user.id === interaction.user.id,
          time: 40000
        });

        menuCollector.on("collect", async i => {
          if (i.customId === "logsec") {
            const kanal = i.values[0];
            client.kufurLogKanal.set(guildId, kanal);

            return i.update({
              embeds: [
                new EmbedBuilder()
                  .setTitle("📌 Log Kanalı Ayarlandı")
                  .setDescription(`<#${kanal}> log kanalı olarak ayarlandı.`)
                  .setColor(0x0099ff)
              ],
              components: [row2] // select menu kaldırılır
            });
          }

          if (i.customId === "kapat") {
            await i.update({
              embeds: [
                new EmbedBuilder()
                  .setTitle("🔄 Sistem Kapatılıyor…")
                  .setDescription("Lütfen bekleyiniz…")
                  .setColor(0xff9900)
              ],
              components: []
            });

            setTimeout(async () => {
              client.kufurEngelAktif.set(guildId, false);
              client.kufurLogKanal.delete(guildId);

              await msg.edit({
                embeds: [
                  new EmbedBuilder()
                    .setTitle("🛑 Sistem Kapatıldı")
                    .setColor(0xff0000)
                ]
              });
            }, 2000);
          }
        });
      }
    });
  }
};
