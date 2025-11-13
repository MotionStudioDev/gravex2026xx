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
    .setDescription("Grave yardım komutları listelenir."),

  async execute(interaction) {
    // Yardım menüsüne elle eklenen komutlar ve kategoriler
    const helpMenu = {
      "Genel": [
        { name: "yardım", desc: "Yardım menüsünü gösterir" },
        { name: "bilgi",  desc: "Bot hakkında bilgi verir" }
      ],
      "Moderasyon": [
        { name: "ban", emoji: "🔨", desc: "Kullanıcıyı yasaklar" },
        { name: "kick", emoji: "👢", desc: "Kullanıcıyı sunucudan atar" }
      ],
      "Eğlence": [
        { name: "şaka", emoji: "😂", desc: "Rastgele şaka yapar" },
        { name: "zar", emoji: "🎲", desc: "Zar atar" }
      ]
    };

    const categories = Object.keys(helpMenu);
    let currentCategory = categories[0];

    const getEmbed = (category) => {
      const embed = new EmbedBuilder()
        .setTitle(`📂 Grave Yardım Menüsü — ${category}`)
        .setColor(0x00bfff)
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setFooter({
          text: `${moment().format("DD MMMM YYYY HH:mm")} • ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL()
        });

      helpMenu[category].forEach(cmd => {
        embed.addFields({
          name: `${cmd.emoji} /${cmd.name}`,
          value: cmd.desc,
          inline: false
        });
      });

      return embed;
    };

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

    const message = await interaction.reply({
      embeds: [getEmbed(currentCategory)],
      components: [getButtons()],
      ephemeral: true
    });

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
