const { ActivityType, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
const token = process.env.TOKEN;
const testGuildId = "1414192526075629690"; // kendi sunucunun ID'si

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    // Durum döngüsü
    let activities = [`MotionStudıo`, `Grave - 0.0.1`, `Yakında`, `${client.user.username}`], i = 0;
    setInterval(() => {
      client.user.setActivity({
        name: `${activities[i++ % activities.length]}`,
        type: ActivityType.Streaming,
        url: `https://twitch.tv/egemenxgul`
      });
    }, 22000);

    // Slash komutları yükle
    const rest = new REST({ version: "10" }).setToken(token);
    const slashcommands = [];

    client.slashcommands.forEach(cmd => {
      slashcommands.push(cmd.data.toJSON());
    });

    try {
      // 1. Önce test sunucuna yükle (anında çalışır)
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, testGuildId),
        { body: slashcommands }
      );
      console.log("✅ Test sunucusuna komutlar yüklendi.");

      // 2. Sonra global olarak yükle (1 saat sonra aktif olur)
      setTimeout(async () => {
        await rest.put(
          Routes.applicationCommands(client.user.id),
          { body: slashcommands }
        );
        console.log("🌍 Global komutlar yüklendi.");
      }, 5000); // 5 saniye bekletiyoruz
    } catch (error) {
      console.error("❌ Komut yükleme hatası:", error);
    }

    console.log(`🚀 ${client.user.username} aktif!`);
  }
};
