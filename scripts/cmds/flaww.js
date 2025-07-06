const axios = require("axios");
const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");

const imageStore = {};

module.exports.config = {
  name: "fla2",
  version: "1.5",
  role: 0,
  author: "xrotick🥀 + ChatGPT",
  description: "Generate 4 AI images using FluxUltra and show them as a single image (with u1–u4 recall)",
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

    // Combine images into one
    const [img1, img2, img3, img4] = await Promise.all(imagePaths.map(p => Jimp.read(p)));
    const width = img1.bitmap.width;
    const height = img1.bitmap.height;

    const combined = new Jimp(width * 2, height * 2);

    combined.composite(img1, 0, 0);
    combined.composite(img2, width, 0);
    combined.composite(img3, 0, height);
    combined.composite(img4, width, height);

    const finalPath = path.join(__dirname, "cache", `combined_${Date.now()}.png`);
    await combined.writeAsync(finalPath);

    api.sendMessage({
      body: "Here is your combined 4-image grid.\nReply with `u1`, `u2`, `u3`, or `u4` to get individual images.",
      attachment: fs.createReadStream(finalPath)
    }, threadID, (err, info) => {
      if (err || !info?.messageID) {
        console.error("Failed to send combined image:", err);
        return api.sendMessage("Failed to send combined image.", threadID);
      }

      imageStore[info.messageID] = {
        paths: imagePaths,
        timestamp: Date.now(),
        authorID: event.senderID
      };

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