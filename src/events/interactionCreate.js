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
module.exports = {
  name: "interactionCreate",

  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    // ====== EVET (Sistemi Aç) ======
    if (interaction.customId === "caps_ac") {
      await interaction.update({
        content: "⏳ Lütfen bekleyiniz, sistem aktif ediliyor...",
        components: [],
      });

      setTimeout(async () => {
        client.capsLockAktif = true;
        await interaction.editReply({
          content: "✅ **Sistem sunucuda aktif edildi!**\nKapatmak istiyorsanız **KAPAT** tuşuna basınız.",
          components: [
            new (require("discord.js").ActionRowBuilder)().addComponents(
              new (require("discord.js").ButtonBuilder)()
                .setCustomId("caps_kapat")
                .setLabel("KAPAT")
                .setStyle(require("discord.js").ButtonStyle.Danger)
            ),
          ],
        });
      }, 1000);
    }

    // ====== HAYIR (Talep reddedildi) ======
    else if (interaction.customId === "caps_hayir") {
      await interaction.update({
        content: "❌ Talebiniz reddedilmiştir.",
        components: [],
      });
      setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
    }

    // ====== KAPAT (Sistemi kapat) ======
    else if (interaction.customId === "caps_kapat") {
      await interaction.update({
        content: "⏳ Lütfen bekleyiniz, sistem kapatılıyor...",
        components: [],
      });

      setTimeout(async () => {
        client.capsLockAktif = false;
        await interaction.editReply({
          content: "🛑 **Sistem kapatıldı.**",
          components: [],
        });
      }, 1000);
    }
  },
};
