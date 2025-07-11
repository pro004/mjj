const axios = require('axios');

const csbApi = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/nazrul4x/Noobs/main/Apis.json"
  );
  return base.data.csb;
};

module.exports = {
    config: {
        name: "imgur",
        version: "1.0.0",
        role: 0,
        author: "♡ Nazrul ♡",
        shortDescription: "imgur upload",
        countDown: 0,
        category: "media",
        guide: {
            en: '[reply to image]'
        }
    },

    onStart: async ({ api, event }) => {
        let link2;

        if (event.type === "message_reply" && event.messageReply.attachments.length > 0) {
            link2 = event.messageReply.attachments[0].url;
        } else if (event.attachments.length > 0) {
            link2 = event.attachments[0].url;
        } else {
            return api.sendMessage('No attachment detected. Please reply to an image.', event.threadID, event.messageID);
        }

        try {
            const res = await axios.get(`${await csbApi()}/nazrul/imgur?link=${encodeURIComponent(link2)}`);
            const link = res.data.uploaded.image;
            return api.sendMessage(`\n\n${link}`, event.threadID, event.messageID);
        } catch (error) {
            console.error("Error uploading image to Imgur:", error);
            return api.sendMessage("An error occurred while uploading the image to Imgur.", event.threadID, event.messageID);
        }
    }
};
