const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  config: {
    name: "gpt",
    version: "2.1",
    author: "Shikaki",
    countDown: 5,
    role: 0,
    category: "chat-ai",
    description: {
      en: "Chat with the Gemini model via Blackbox API"
    },
    guide: {
      en: "{pn} <your message> — Ask Gemini a question\n{pn} clear — Clear chat history"
    }
  },

  onStart: async function ({ api, message, event, args, commandName }) {
    const content = (event.type === "message_reply") ? event.messageReply.body : args.join(" ").trim();
    if (!content) return message.reply("Please provide a question for Gemini.");

    if (content.toLowerCase() === "clear") {
      return message.reply("Chat history cleared!");
    }

    const apiUrl = `https://hazeyyyy-rest-apis.onrender.com/api/gemini?question=${encodeURIComponent(content)}`;

    try {
      api.setMessageReaction("⌛", event.messageID, () => {}, true);
      const { data } = await axios.get(apiUrl);

      const replyText = data?.gemini || "⚠️ No response received from Gemini API.";
      const imageUrls = [
        ...(Array.isArray(data.web_images) ? data.web_images : []),
        ...(typeof data.generated_image === "string" ? [data.generated_image] : (data.generated_image || []))
      ];

      const attachments = await downloadImages(imageUrls);

      message.reply({ body: replyText, attachment: attachments }, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID
          });
        }
      });

    } catch (error) {
      console.error("Gemini API error:", error.message);
      api.sendMessage("❌ Error: " + error.message, event.threadID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  },

  onReply: async function ({ api, message, event, Reply, args }) {
    if (event.senderID !== Reply.author) return;

    const prompt = args.join(" ").trim();
    if (!prompt) return message.reply("Please provide a question.");

    if (prompt.toLowerCase() === "clear") {
      return message.reply("Chat history cleared!");
    }

    const apiUrl = `https://hazeyyyy-rest-apis.onrender.com/api/gemini?question=${encodeURIComponent(prompt)}`;

    try {
      api.setMessageReaction("⌛", event.messageID, () => {}, true);
      const { data } = await axios.get(apiUrl);

      const replyText = data?.gemini || "⚠️ No response received from Gemini API.";
      const imageUrls = [
        ...(Array.isArray(data.web_images) ? data.web_images : []),
        ...(typeof data.generated_image === "string" ? [data.generated_image] : (data.generated_image || []))
      ];

      const attachments = await downloadImages(imageUrls);

      message.reply({ body: replyText, attachment: attachments }, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: Reply.commandName,
            messageID: info.messageID,
            author: event.senderID
          });
        }
      });

    } catch (error) {
      console.error("Gemini API error:", error.message);
      api.sendMessage("❌ Error: " + error.message, event.threadID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};

// Helper to download and return image streams
async function downloadImages(urls) {
  const imageBuffers = [];

  // Ensure cache folder exists
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  for (const url of urls.slice(0, 5)) {
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data, "binary");
      const filename = `${uuidv4()}.jpg`;
      const filepath = path.join(cacheDir, filename);

      fs.writeFileSync(filepath, buffer);
      imageBuffers.push(fs.createReadStream(filepath));

      // Auto-delete after 60 seconds
      setTimeout(() => {
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      }, 60000);
    } catch (err) {
      console.error("Failed to download image:", err.message);
    }
  }

  return imageBuffers;
}