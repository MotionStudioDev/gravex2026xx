const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Belirtilen ID'deki kullanıcıyı sunucudan unbanlar.")
    .addStringOption(option =>
      option.setName("id")
        .setDescription("Unban yapılacak kullanıcının ID'si")
        .setRequired(true)
    ),

  async execute(interaction) {
    const client = interaction.client;
    const guild = interaction.guild;
    const member = guild.members.cache.get(interaction.user.id);
    const isKurucu = guild.ownerId === interaction.user.id;
    const isYetkili = member?.permissions.has("BanMembers");

    if (!isKurucu && !isYetkili) {
      const embed = new EmbedBuilder()
        .setTitle("🚫 Yetki Yok")
        .setDescription("Bu komutu sadece **sunucu sahibi** veya **ban yetkisine sahip** kişiler kullanabilir.")
        .setColor(0xff0000);

      const reply = await interaction.reply({ embeds: [embed], ephemeral: false });
      setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
      return;
    }

    const userId = interaction.options.getString("id");

    let banList;
    try {
      banList = await guild.bans.fetch();
    } catch (err) {
      return interaction.reply({ content: "❌ Ban listesi alınamadı.", ephemeral: true });
    }

    const bannedUser = banList.get(userId);
    if (!bannedUser) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle("ℹ️ Kullanıcı Banlı Değil")
          .setDescription(`\`${userId}\` ID'li kullanıcı sunucuda banlı değil.`)
          .setColor(0xffcc00)],
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("⚠️ Onay Gerekli")
      .setDescription(`\`${userId}\` ID'li kullanıcıyı unbanlamak istediğinize emin misiniz?`)
      .setColor(0xffcc00);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("onayla").setLabel("✅ EVET").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("iptal").setLabel("❌ HAYIR").setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
    const msg = await interaction.fetchReply();

    const collector = msg.createMessageComponentCollector({
      time: 15000,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on("collect", async i => {
      if (i.customId === "iptal") {
        await i.update({
          embeds: [new EmbedBuilder().setDescription("❌ Talebiniz iptal edildi.").setColor(0xaaaaaa)],
          components: []
        });
        return;
      }

      if (i.customId === "onayla") {
        await i.update({
          embeds: [new EmbedBuilder().setDescription("⏳ Lütfen bekleyiniz, unban işlemi yapılıyor...").setColor(0xffcc00)],
          components: []
        });

        try {
          await guild.members.unban(userId);
          setTimeout(() => {
            msg.edit({
              embeds: [new EmbedBuilder()
                .setTitle("✅ Unban Başarılı")
                .setDescription(`\`${userId}\` ID'li kullanıcının banı kaldırıldı.`)
                .setColor(0x00aa00)],
              components: []
            });
          }, 2000);
        } catch (err) {
          msg.edit({
            embeds: [new EmbedBuilder()
              .setTitle("❌ Hata")
              .setDescription(`Unban işlemi başarısız oldu: \`${err.message}\``)
              .setColor(0xff0000)],
            components: []
          });
        }
      }
    });
  }
};
