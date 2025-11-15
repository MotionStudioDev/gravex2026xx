const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("caps-lock")
    .setDescription("Caps-Lock engelleme sistemini yönetirsiniz."),
    
  async execute(interaction, client) {

    // interaction'ın cevapsız kalmasını önlemek için
    await interaction.deferReply({ ephemeral: false });

    client.emit("capsCommandUsed", interaction); // index.js'deki event tetikleniyor
  }
};
