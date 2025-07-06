const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "edit",
    aliases: ['imgedit'],
    author: "Mahi--",
    version: "1.0",
    cooldowns: 20,
    role: 0,
    shortDescription: "Edit image with text prompt",
    longDescription: "Edits an image using the provided text prompt and image link or replied image",
    category: "media",
    guide: "{p}edit <prompt> (reply to image) or {p}edit <image_url> <prompt>",
  },
  onStart: async function ({ message, args, api, event }) {
    // Obfuscated author name check
    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 105, 45, 45);
    if (this.config.author !== obfuscatedAuthor) {
      return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
    }

    // Get image URL and prompt
    let imageUrl, prompt;
    
    if (event.messageReply && event.messageReply.attachments.length > 0) {
      // Case: Reply to an image with prompt in arguments
      imageUrl = event.messageReply.attachments[0].url;
      prompt = args.join(" ");
    } else if (args.length >= 2) {
      // Case: Image URL and prompt provided as arguments
      imageUrl = args[0];
      prompt = args.slice(1).join(" ");
    } else {
      return api.sendMessage("❌ | Invalid format. Use:\n• Reply to an image with '{p}edit <prompt>'\n• Or '{p}edit <image_url> <prompt>'", event.threadID);
    }

    if (!prompt) {
      return api.sendMessage("❌ | Please provide a text prompt for the image editing.", event.threadID);
    }

    api.sendMessage("🔄 | Editing your image, please wait...", event.threadID, event.messageID);

    try {
      const editApiUrl = `http://193.149.164.141:9995/i/api/edit?url=${encodeURIComponent(imageUrl)}&txt=${encodeURIComponent(prompt)}`;

      const response = await axios.get(editApiUrl, {
        responseType: "arraybuffer"
      });

      const cacheFolderPath = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }
      const imagePath = path.join(cacheFolderPath, `${Date.now()}_edited_image.jpg`);
      fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));

      const stream = fs.createReadStream(imagePath);
      message.reply({
        body: `✅ | Image edited with prompt: "${prompt}"`,
        attachment: stream
      });
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred while editing the image. Please try again later.");
    }
  }
};
