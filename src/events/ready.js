const { ActivityType } = require("discord.js")
module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    let activities = [`MotionStudıo`, `Grave - 0.0.1`, `Yakında`, `${client.user.username}`], i = 0;
    setInterval(() => client.user.setActivity({ name: `${activities[i++ % activities.length]}`, type: ActivityType.Streaming, url: `https://twitch.tv/egemenxgul` }), 22000);
  }
};
