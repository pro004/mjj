const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

module.exports = {
  config: {
    name: "imagegen",
    version: "2.1",
    author: "Xrotick🥀",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Generate 4 styled AI images with grid output" },
    longDescription: { en: "Generates 4 variant AI images, resizes them for perfect grid, allows reply with u1-u4 to retrieve individually." },
    category: "image",
    guide: {
      en: "{pn} <prompt> [-r <aspect_ratio>]\nExample: {pn} beautiful castle -r 16:9"
    }
  },

  onStart: async function ({ message, args, event }) {
    if (args.length === 0) {
      return message.reply("Please provide a prompt. Example: `imagegen beautiful castle -r 16:9`");
    }

    const fullText = args.join(" ");
    const ratioMatch = fullText.match(/-r\s+(\d+:\d+)/);
    const aspect_ratio = ratioMatch ? ratioMatch[1] : "16:9";
    const basePrompt = fullText.replace(/-r\s+\d+:\d+/, "").trim();

    if (!basePrompt) return message.reply("You must provide a prompt.");

    const apiUrl = `https://1yjs1yldj7.execute-api.us-east-1.amazonaws.com/default/ai_image`;
    const promptVariants = [
      `ultra realistic, ${basePrompt}`,
      `8k UHD, cinematic lighting, ${basePrompt}`,
      `trending on artstation, ${basePrompt}`,
      `high detail, dramatic tone, ${basePrompt}`
    ];

    const imagePaths = [];

    try {
      const wait = await message.reply("Generating 4 AI images, optimizing, please wait...");

      for (let i = 0; i < 4; i++) {
        const { data } = await axios.get(apiUrl, {
          params: { prompt: promptVariants[i], aspect_ratio, link: "writecream.com" }
        });

        if (!data.image_link) throw new Error("Image link not returned.");

        const imgBuffer = (await axios.get(data.image_link, { responseType: "arraybuffer" })).data;
        const rawPath = path.join(__dirname, "cache", `u${i + 1}_${Date.now()}.png`);
        const resizedPath = path.join(__dirname, "cache", `resized_u${i + 1}.png`);

        fs.writeFileSync(rawPath, imgBuffer);

        await sharp(rawPath)
          .resize(1024, 1024, { fit: "cover" }) // Ensures all images are the same size
          .toFile(resizedPath);

        imagePaths.push(resizedPath);
        fs.unlinkSync(rawPath); // Delete raw file after resize
      }

      // Merge 4 into grid (2x2)
      const combinedImagePath = path.join(__dirname, "cache", `grid_${Date.now()}.png`);
      await sharp({
        create: {
          width: 2048,
          height: 2048,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([
          { input: imagePaths[0], top: 0, left: 0 },
          { input: imagePaths[1], top: 0, left: 1024 },
          { input: imagePaths[2], top: 1024, left: 0 },
          { input: imagePaths[3], top: 1024, left: 1024 }
        ])
        .png()
        .toFile(combinedImagePath);

      await message.reply({
        body: `Here are your 4 generated image variants.\nReply with "u1", "u2", "u3", or "u4" to get any image individually.`,
        attachment: fs.createReadStream(combinedImagePath)
      }, (err, info) => {
        if (!err && info?.messageID) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            author: event.senderID,
            u: imagePaths
          });
        }
        fs.unlinkSync(combinedImagePath);
      });

      if (wait?.messageID) message.unsend(wait.messageID);
    } catch (err) {
      console.error("ImageGen Error:", err);
      message.reply("Failed to generate or process image. Please try again.");
    }
  },

  onReply: async function ({ message, event, Reply }) {
    const input = event.body.toLowerCase();
    if (!["u1", "u2", "u3", "u4"].includes(input)) return;

    const index = parseInt(input[1]) - 1;
    const filePath = Reply.u[index];
    if (!fs.existsSync(filePath)) return message.reply("Requested image not found.");

    await message.reply({
      body: `Here's variant ${input.toUpperCase()}`,
      attachment: fs.createReadStream(filePath)
    });

    // Optionally delete image after reply
    fs.unlinkSync(filePath);
  }
};