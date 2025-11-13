const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bir üyeyi sunucudan yasaklar")
    .addUserOption(option =>
      option.setName("üye")
        .setDescription("Banlanacak kişi")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("sebep")
        .setDescription("Ban sebebi (isteğe bağlı)")
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("üye");
    const reason = interaction.options.getString("sebep") || "Belirtilmedi";
    const member = interaction.guild.members.cache.get(target.id);
    const executor = interaction.member;

    // 🔒 Yetki kontrolü: ban yetkisi veya sunucu sahibi mi?
    const isOwner = interaction.guild.ownerId === executor.id;
    const hasBanPermission = executor.permissions.has(PermissionFlagsBits.BanMembers);

    if (!isOwner && !hasBanPermission) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🚫 Yetki Yok")
            .setDescription("Bu komutu sadece sunucu sahibi veya ban yetkisi olanlar kullanabilir.")
            .setColor(0xff0000)
        ],
        ephemeral: true
      });
    }

    if (!member) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Kullanıcı Bulunamadı")
            .setDescription("Belirttiğiniz kullanıcı bu sunucuda değil.")
            .setColor(0xff0000)
        ],
        ephemeral: true
      });
    }

    if (!member.bannable) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🚫 Ban İşlemi Başarısız")
            .setDescription("Bu kullanıcıyı banlayamıyorum. Yetkisi yüksek olabilir.")
            .setColor(0xff0000)
        ],
        ephemeral: true
      });
    }

    const confirmEmbed = new EmbedBuilder()
      .setTitle("⚠️ Ban Onayı")
      .setDescription(`**${target.tag}** adlı kullanıcıyı banlamak üzeresiniz.\nSebep: \`${reason}\`\n\nBanlamak istiyor musunuz?`)
      .setColor(0xffcc00)
      .setFooter({ text: `İşlem yapan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ban_onay")
        .setLabel("✅ EVET")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("ban_iptal")
        .setLabel("❌ HAYIR")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      ephemeral: true
    });

    const collector = interaction.channel.createMessageComponentCollector({
      time: 15000,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on("collect", async i => {
      if (i.customId === "ban_onay") {
        await member.ban({ reason });

        const successEmbed = new EmbedBuilder()
          .setTitle("✅ Ban İşlemi Başarılı")
          .setDescription(`**${target.tag}** adlı kullanıcı banlandı.\n\n**Banlayan:** ${interaction.user.tag}\n**Sebep:** \`${reason}\``)
          .setColor(0x00bfff)
          .setThumbnail(target.displayAvatarURL());

        await i.update({ embeds: [successEmbed], components: [] });
      }

      if (i.customId === "ban_iptal") {
        const cancelEmbed = new EmbedBuilder()
          .setTitle("❌ İşlem İptal Edildi")
          .setDescription("Ban işlemi iptal edildi.")
          .setColor(0xaaaaaa);

        await i.update({ embeds: [cancelEmbed], components: [] });
      }
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {}
    });
  }
};
