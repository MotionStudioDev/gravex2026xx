const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.slashcommands.get(interaction.commandName);
    if (!command) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Komut Bulunamadı")
            .setDescription("Bu komut sistemde kayıtlı değil.")
            .setColor(0xff0000)
        ],
        ephemeral: true
      });
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`❌ Komut çalıştırılırken hata:`, error);

      const errorEmbed = new EmbedBuilder()
        .setTitle("🚨 Hata Oluştu")
        .setDescription("Komut çalışırken bir sorun oluştu. Lütfen daha sonra tekrar dene.")
        .setColor(0xff0000)
        .setFooter({ text: `Komut: /${interaction.commandName}` })
        .setTimestamp();

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }
};
////
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;
  const { customId, guild } = interaction;

  if (customId === "modlog-kapat") {
    interaction.client.modLogAktifGuilds?.delete(guild.id);
    interaction.client.modLogKanal?.delete(guild.id);

    await interaction.update({
      embeds: [new EmbedBuilder()
        .setDescription("✅ Mod-Log sistemi kapatıldı.")
        .setColor(0x00aa00)],
      components: []
    });
  }
});
