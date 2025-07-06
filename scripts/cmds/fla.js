const axios = require("axios");
const fs = require("fs");
const path = require("path");

const imageStore = {};

module.exports.config = {
  name: "anixl",
  version: "1.4",
  role: 0,
  author: "xrotick🥀",
  description: "Generate 4 AI images using FluxUltra and recall them via reply (u1–u4)",
  category: "img-gen",
  guide: "{pn} [prompt]\nExample: {pn} futuristic samurai warrior\nReply with u1, u2, u3, or u4 to access each image.",
  countDown: 15
};

module.exports.onStart = async ({ event, args, api }) => {
  const promptInput = args.join(" ");
  const apiUrl = "https://zaikyoov3.koyeb.app/api/animaginexl";
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!promptInput) {
    return api.sendMessage("Please provide a prompt.\nExample: fla a cat riding a skateboard", threadID, messageID);
  }

  const prompt = `8k quality, ${promptInput}`;
  const waitingMsg = await api.sendMessage("Generating 4 AI images, please wait...", threadID);
  api.setMessageReaction("⌛", messageID, () => {}, true);

  const imagePaths = [];

  try {
    for (let i = 0; i < 4; i++) {
      const response = await axios.get(`${apiUrl}?prompt=${encodeURIComponent(prompt)}`, { responseType: "arraybuffer" });
      const imgPath = path.join(__dirname, "cache", `flux_${Date.now()}_${i}.png`);
      fs.writeFileSync(imgPath, Buffer.from(response.data));
      imagePaths.push(imgPath);
    }

    api.sendMessage({
      body: "Here are your 4 AI-generated images (8k quality).\nReply with `u1`, `u2`, `u3`, or `u4` to access a specific image again.",
      attachment: imagePaths.map(p => fs.createReadStream(p))
    }, threadID, (err, info) => {
      if (err || !info?.messageID) {
        console.error("Failed to send image batch:", err);
        return api.sendMessage("Failed to send images. Check attachment size or file system.", threadID);
      }

      // Store for reply handling
      imageStore[info.messageID] = {
        paths: imagePaths,
        timestamp: Date.now(),
        authorID: event.senderID
      };

      // Setup reply listener
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "fla",
        messageID: info.messageID,
        author: event.senderID
      });
    });

    api.setMessageReaction("✅", messageID, () => {}, true);
    api.unsendMessage(waitingMsg.messageID);
  } catch (err) {
    console.error("FluxUltra error:", err.message);
    api.sendMessage("Image generation failed: " + err.message, threadID, messageID);
  }
};

module.exports.onReply = async ({ event, api }) => {
  const input = event.body?.trim().toLowerCase();
  const replyID = event.messageReply?.messageID;

  if (!replyID || !["u1", "u2", "u3", "u4"].includes(input)) return;

  const session = imageStore[replyID];
  if (!session) return api.sendMessage("Session expired or not found. Please generate images again.", event.threadID);

  const index = parseInt(input[1]) - 1;
  const filePath = session.paths[index];

  if (!filePath || !fs.existsSync(filePath)) {
    return api.sendMessage(`Image ${input.toUpperCase()} is no longer available.`, event.threadID);
  }

  api.sendMessage({
    body: `Here is image ${input.toUpperCase()}:`,
    attachment: fs.createReadStream(filePath)
  }, event.threadID, event.messageID);
};