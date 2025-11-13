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
    .setName("kick")
    .setDescription("Bir üyeyi sunucudan atar")
    .addUserOption(option =>
      option.setName("üye")
        .setDescription("Kicklenecek kişi")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("sebep")
        .setDescription("Kick sebebi (isteğe bağlı)")
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("üye");
    const reason = interaction.options.getString("sebep") || "Belirtilmedi";
    const member = interaction.guild.members.cache.get(target.id);
    const executor = interaction.member;

    const isOwner = interaction.guild.ownerId === executor.id;
    const hasKickPermission = executor.permissions.has(PermissionFlagsBits.KickMembers);

    if (!isOwner && !hasKickPermission) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🚫 Yetki Yok")
            .setDescription("Bu komutu sadece sunucu sahibi veya kick yetkisi olanlar kullanabilir.")
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

    if (!member.kickable) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🚫 Kick İşlemi Başarısız")
            .setDescription("Bu kullanıcıyı kickleyemiyorum. Yetkisi yüksek olabilir.")
            .setColor(0xff0000)
        ],
        ephemeral: true
      });
    }

    const confirmEmbed = new EmbedBuilder()
      .setTitle("⚠️ Kick Onayı")
      .setDescription(`**${target.tag}** adlı kullanıcıyı kicklemek üzeresiniz.\nSebep: \`${reason}\`\n\nKicklemek istiyor musunuz?`)
      .setColor(0xffcc00)
      .setFooter({ text: `İşlem yapan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("kick_onay")
        .setLabel("✅ EVET")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("kick_iptal")
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
      if (i.customId === "kick_onay") {
        await member.kick(reason);

        const successEmbed = new EmbedBuilder()
          .setTitle("✅ Kick İşlemi Başarılı")
          .setDescription(`**${target.tag}** adlı kullanıcı sunucudan atıldı.\n\n**Kickleyen:** ${interaction.user.tag}\n**Sebep:** \`${reason}\``)
          .setColor(0x00bfff)
          .setThumbnail(target.displayAvatarURL());

        await i.update({ embeds: [successEmbed], components: [] });
      }

      if (i.customId === "kick_iptal") {
        const cancelEmbed = new EmbedBuilder()
          .setTitle("❌ İşlem İptal Edildi")
          .setDescription("Kick işlemi iptal edildi.")
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
