// commands/reklam-engel.js
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reklam-engel")
    .setDescription("Reklam engelleme sistemini aç/kapat"),

  async execute(interaction) {
    const client = interaction.client;
    const guildId = interaction.guild.id;

    // Sadece sunucu sahibi
    if (interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle("Yetki Yok")
          .setDescription("Sadece **sunucu sahibi** kullanabilir.")
          .setColor(0xff0000)
        ],
        ephemeral: true
      });
    }

    // Başlat
    if (!client.reklamKorumaAktif) client.reklamKorumaAktif = false;
    if (!client.reklamLogKanal) client.reklamLogKanal = new Map();

    const aktif = client.reklamKorumaAktif;

    // === ZATEN AKTİF ===
    if (aktif) {
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle("Sistem Zaten Aktif")
          .setDescription("Kapatmak için butona bas.")
          .setColor(0x00bfff)
        ],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("reklam_kapat")
            .setLabel("KAPAT")
            .setStyle(ButtonStyle.Danger)
        )],
        ephemeral: true
      });
      return await handleCollector(interaction, "kapat");
    }

    // === AÇMA ===
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle("Reklam Engelleme Sistemi")
        .setDescription("Aktif etmek için **AÇ** butonuna bas.\nİptal için **İPTAL**.")
        .setColor(0xffcc00)
      ],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("reklam_ac").setLabel("AÇ").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("reklam_iptal").setLabel("İPTAL").setStyle(ButtonStyle.Secondary)
      )],
      ephemeral: true
    });

    await handleCollector(interaction, "ac");
  }
};

// TEK COLLECTOR
async function handleCollector(interaction, step) {
  const collector = interaction.channel.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id,
    time: step === "ac" ? 30000 : 20000
  });

  collector.on("collect", async i => {
    const client = interaction.client;
    const guildId = interaction.guild.id;

    // KAPAT
    if (i.customId === "reklam_kapat") {
      client.reklamKorumaAktif = false;
      client.reklamLogKanal.delete(guildId);

      await i.update({
        embeds: [new EmbedBuilder().setTitle("Sistem Kapatılıyor...").setColor(0xff9900)],
        components: []
      });

      setTimeout(async () => {
        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle("Sistem Kapatıldı")
            .setDescription("Reklam engelleme **devre dışı**.")
            .setColor(0xff0000)
          ],
          components: []
        }).catch(() => {});
      }, 1000);

      collector.stop("kapatildi");
      return;
    }

    // İPTAL
    if (i.customId === "reklam_iptal") {
      await i.update({
        embeds: [new EmbedBuilder().setTitle("İşlem İptal Edildi").setColor(0xaaaaaa)],
        components: []
      });
      collector.stop("iptal");
      return;
    }

    // AÇ
    if (i.customId === "reklam_ac") {
      client.reklamKorumaAktif = true;

      const kanallar = interaction.guild.channels.cache
        .filter(c => c.type === ChannelType.GuildText &&
          c.permissionsFor(interaction.guild.members.me)?.has([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages])
        )
        .map(c => ({ label: c.name.slice(0, 100), value: c.id }))
        .slice(0, 24);

      const select = new StringSelectMenuBuilder()
        .setCustomId("reklam_logkanal")
        .setPlaceholder("Log kanalı seç (isteğe bağlı)")
        .addOptions([
          { label: "Log Kullanma", value: "none", description: "Log gönderme" },
          ...kanallar
        ]);

      await i.update({
        embeds: [new EmbedBuilder()
          .setTitle("Sistem Aktif")
          .setDescription("Reklam engelleme **açıldı**.\nLog kanalı seç (isteğe bağlı).")
          .setColor(0x00ff00)
        ],
        components: [new ActionRowBuilder().addComponents(select)]
      });
      return;
    }

    // LOG SEÇ
    if (i.customId === "reklam_logkanal") {
      const secilen = i.values[0];
      if (secilen === "none") {
        client.reklamLogKanal.delete(guildId);
        await i.update({
          embeds: [new EmbedBuilder()
            .setTitle("Log Kapatıldı")
            .setDescription("Log gönderimi **kapalı**.")
            .setColor(0x00bfff)
          ],
          components: []
        });
      } else {
        client.reklamLogKanal.set(guildId, secilen);
        await i.update({
          embeds: [new EmbedBuilder()
            .setTitle("Log Ayarlandı")
            .setDescription(`Loglar artık <#${secilen}> kanalına gidiyor.`)
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
        embeds: [new EmbedBuilder()
          .setTitle("Zaman Aşımı")
          .setDescription("30 saniye içinde işlem yapılmadı.")
          .setColor(0xaaaaaa)
        ],
        components: []
      }).catch(() => {});
    }
  });
}
