const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("caps-lock")
    .setDescription("Caps-Lock engelleme sistemini açıp kapatmanızı sağlar."),

  async execute(interaction, client) {
    // Önce yanıt süresini başlat (Uygulama yanıt vermedi hatasını %100 engeller)
    await interaction.deferReply({ ephemeral: false });

    // Yetki kontrolü
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
      interaction.guild.ownerId !== interaction.member.id
    ) {
      await interaction.editReply("❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısınız!");
      setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
      return;
    }

    // Sistem zaten aktif
    if (client.capsLockAktif) {
      const closeBtn = new ButtonBuilder()
        .setCustomId("caps_kapat")
        .setLabel("KAPAT")
        .setStyle(ButtonStyle.Danger);

      return interaction.editReply({
        content: "⚠️ **Sistem zaten aktif!**\nKapatmak için **KAPAT** butonuna tıklayın.",
        components: [new ActionRowBuilder().addComponents(closeBtn)],
      });
    }

    // Sistem kapalı → kullanıcıya sor
    const yesBtn = new ButtonBuilder()
      .setCustomId("caps_ac")
      .setLabel("EVET")
      .setStyle(ButtonStyle.Success);

    const noBtn = new ButtonBuilder()
      .setCustomId("caps_hayir")
      .setLabel("HAYIR")
      .setStyle(ButtonStyle.Danger);

    return interaction.editReply({
      content: "⚠️ **Dikkat!** Caps-Lock sistemi aktif edilmek üzere.\nSistemi açmak istiyor musunuz?",
      components: [new ActionRowBuilder().addComponents(yesBtn, noBtn)],
    });
  },
};
