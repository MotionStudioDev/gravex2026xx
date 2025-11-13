const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const moment = require("moment");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bilgi")
    .setDescription("Bot hakkında detaylı bilgi verir"),

  async execute(interaction) {
    const client = interaction.client;

    const embed = new EmbedBuilder()
      .setTitle("🤖 Bot Bilgisi")
      .setColor(0x00bfff)
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: "📛 Bot Adı", value: client.user.username, inline: true },
        { name: "🆔 Bot ID", value: client.user.id, inline: true },
        { name: "👑 Sahip", value: "<@702901632136118273>", inline: true },
        { name: "🌐 Sunucu Sayısı", value: `${client.guilds.cache.size}`, inline: true },
        { name: "👥 Kullanıcı Sayısı", value: `${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`, inline: true },
        { name: "📦 Komut Sayısı", value: `${client.slashcommands.size}`, inline: true },
        { name: "🕒 Tarih & Saat", value: `${moment().format("DD MMMM YYYY HH:mm")}` }
      )
      .setFooter({
        text: `İsteyen: ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
