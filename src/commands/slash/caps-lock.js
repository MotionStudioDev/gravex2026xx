const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("caps-lock")
    .setDescription("Büyük harf engelleme sistemini aç/kapat"),

  async execute(interaction) {
    const client = interaction.client;
    const member = interaction.member;
    const isKurucu = interaction.guild.ownerId === interaction.user.id;
    const isYonetici = member.permissions.has("ManageGuild");

    if (!isKurucu && !isYonetici) {
      const embed = new EmbedBuilder()
        .setTitle("🚫 Yetki Yok")
        .setDescription("Bu komutu sadece **sunucu sahibi** veya **yönetici yetkisine sahip** kişiler kullanabilir.")
        .setColor(0xff0000);

      const reply = await interaction.reply({ embeds: [embed], ephemeral: false });
      setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
      return;
    }

    if (client.capsLockAktif) {
      client.capsLockAktif = false;

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle("🛑 Sistem Kapatıldı")
          .setDescription("Büyük harf engelleme sistemi devre dışı bırakıldı.")
          .setColor(0xff0000)]
      });
    } else {
      client.capsLockAktif = true;

      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle("✅ Sistem Aktif Edildi")
          .setDescription("Büyük harf engelleme sistemi aktif hale getirildi.")
          .setColor(0x00aa00)]
      });
    }
  }
};
