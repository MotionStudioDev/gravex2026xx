const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const moment = require("moment");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yardım")
    .setDescription("Komutları kategoriye göre gösterir"),

  async execute(interaction) {
    const allCommands = [...interaction.client.slashcommands.values()];

    // Komutları kategorilere ayır
    const categorized = {};
    allCommands.forEach(cmd => {
      const category = cmd.category || "Genel";
      if (!categorized[category]) categorized[category] = [];
      categorized[category].push(cmd);
    });

    const categories = Object.keys(categorized);
    let currentCategory = categories[0];

    // Embed oluştur
    const getEmbed = (category) => {
      const embed = new EmbedBuilder()
        .setTitle(`📘 Yardım Menüsü — ${category}`)
        .setColor(0x00bfff)
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setFooter({
          text: `${moment().format("DD MMMM YYYY HH:mm")} • ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL()
        });

      categorized[category].forEach(cmd => {
        const emoji = cmd.emoji || "🔹";
        embed.addFields({
          name: `${emoji} /${cmd.data.name}`,
          value: cmd.data.description || "Açıklama yok",
          inline: false
        });
      });

      return embed;
    };

    // Butonları oluştur
    const getButtons = () => {
      const row = new ActionRowBuilder();
      categories.forEach(cat => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`cat_${cat}`)
            .setLabel(cat)
            .setStyle(cat === currentCategory ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );
      });
      return row;
    };

    // İlk mesaj
    const message = await interaction.reply({
      embeds: [getEmbed(currentCategory)],
      components: [getButtons()],
      ephemeral: true
    });

    // Buton dinleyici
    const collector = message.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async i => {
      if (i.user.id !== interaction.user.id)
        return i.reply({ content: "Bu menü sana ait değil!", ephemeral: true });

      const selected = i.customId.replace("cat_", "");
      currentCategory = selected;

      await i.update({
        embeds: [getEmbed(currentCategory)],
        components: [getButtons()]
      });
    });

    collector.on("end", async () => {
      await message.edit({ components: [] });
    });
  }
};
