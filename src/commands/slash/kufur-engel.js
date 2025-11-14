const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  StringSelectMenuBuilder,
  PermissionsBitField
} = require("discord.js");
const db = require("quick.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kufur-engel")
    .setDescription("Küfür engelleme sistemini aç/kapat"),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    // Sadece sunucu sahibi
    if (interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Yetki Yok")
            .setDescription("Bu komutu sadece **sunucu sahibi** kullanabilir.")
            .setColor(0xff0000)
        ],
        ephemeral: true
      });
    }

    const aktif = db.get(`kufurEngel_${guildId}`);

    // === ZATEN AKTİF ===
    if (aktif) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Sistem Zaten Aktif")
            .setDescription("Kapatmak için aşağıdaki butona bas.")
            .setColor(0x00bfff)
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("kufur_kapat")
              .setLabel("KAPAT")
              .setStyle(ButtonStyle.Danger)
          )
        ],
        ephemeral: true
      });

      return await handleCollector(interaction, "kapat");
    }

    // === AÇMA MENÜSÜ ===
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Küfür Engelleme Sistemi")
          .setDescription("Sistemi **aktif etmek** üzeresin.\n\n**AÇ** → başlatır\n**İPTAL** → vazgeç")
          .setColor(0xffcc00)
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("kufur_ac").setLabel("AÇ").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("kufur_iptal").setLabel("İPTAL").setStyle(ButtonStyle.Secondary)
        )
      ],
      ephemeral: true
    });

    await handleCollector(interaction, "ac");
  }
};

// TEK COLLECTOR – TÜM AKŞI YÖNETİR
async function handleCollector(interaction, step) {
  const collector = interaction.channel.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id,
    time: step === "ac" ? 30000 : 20000
  });

  collector.on("collect", async i => {
    const guildId = interaction.guild.id;

    // KAPAT
    if (i.customId === "kufur_kapat") {
      db.delete(`kufurEngel_${guildId}`);
      db.delete(`kufurLog_${guildId}`);

      await i.update({
        embeds: [new EmbedBuilder().setTitle("Sistem Kapatılıyor...").setColor(0xff9900)],
        components: []
      });

      setTimeout(async () => {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Sistem Kapatıldı")
              .setDescription("Küfür engelleme **devre dışı bırakıldı**.")
              .setColor(0xff0000)
          ],
          components: []
        }).catch(() => {});
      }, 1000);

      collector.stop("kapatildi");
      return;
    }

    // İPTAL
    if (i.customId === "kufur_iptal") {
      await i.update({
        embeds: [new EmbedBuilder().setTitle("İşlem İptal Edildi").setColor(0xaaaaaa)],
        components: []
      });
      collector.stop("iptal");
      return;
    }

    // AÇ
    if (i.customId === "kufur_ac") {
      db.set(`kufurEngel_${guildId}`, true);

      // Botun yazabildiği kanallar
      const kanallar = interaction.guild.channels.cache
        .filter(c =>
          c.type === ChannelType.GuildText &&
          c.permissionsFor(interaction.guild.members.me)?.has([
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ])
        )
        .map(c => ({ label: c.name.slice(0, 100), value: c.id }))
        .slice(0, 24);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("kufur_logkanal")
        .setPlaceholder("Log kanalı seç (isteğe bağlı)")
        .addOptions([
          { label: "Log Kullanma", value: "none", description: "Log gönderme" },
          ...kanallar
        ]);

      await i.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("Sistem Aktif")
            .setDescription("Küfür engelleme **açıldı**.\n\nİsteğe bağlı: Log kanalı seç.")
            .setColor(0x00ff00)
        ],
        components: [new ActionRowBuilder().addComponents(selectMenu)]
      });
      return;
    }

    // LOG KANALI SEÇİMİ
    if (i.customId === "kufur_logkanal") {
      const secilen = i.values[0];

      if (secilen === "none") {
        db.delete(`kufurLog_${guildId}`);
        await i.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("Log Kapatıldı")
              .setDescription("Log gönderimi **devre dışı**.")
              .setColor(0x00bfff)
          ],
          components: []
        });
      } else {
        db.set(`kufurolog_${guildId}`, secilen);
        await i.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("Log Kanalı Ayarlandı")
              .setDescription(`Loglar artık <#${secilen}> kanalına gönderilecek.`)
              .setColor(0x00bfff)
          ],
          components: []
        });
      }
      collector.stop("logsecildi");
    }
  });

  // SADECE GERÇEK ZAMAN AŞIMI
  collector.on("end", (collected, reason) => {
    if (reason === "time" && collected.size === 0) {
      interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Zaman Aşımı")
            .setDescription("30 saniye içinde işlem yapılmadı.")
            .setColor(0xaaaaaa)
        ],
        components: []
      }).catch(() => {});
    }
  });
}
