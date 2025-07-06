const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "ckg",
    version: "1.0",
    author: "Protick",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Check and download public Google Drive video"
    },
    longDescription: {
      en: "Check if a Google Drive link is public and download video if possible"
    },
    category: "utility",
    guide: {
      en: "{pn} <google drive video link>"
    }
  },

  onStart: async function ({ message, args }) {
    const link = args[0];
    if (!link || !link.includes("drive.google.com")) {
      return message.reply("Please provide a valid Google Drive link.");
    }

    try {
      const match = link.match(/[-\w]{25,}/);
      if (!match) return message.reply("Could not extract file ID from the link.");
      const fileId = match[0];

      const downloadURL = `https://drive.google.com/uc?export=download&id=${fileId}`;

      const filePath = path.join(__dirname, `${fileId}.mp4`);
      const writer = fs.createWriteStream(filePath);

      const response = await axios({
        url: downloadURL,
        method: "GET",
        responseType: "stream"
      });

      response.data.pipe(writer);

      writer.on("finish", () => {
        message.reply({
          body: "Here is the downloaded video:",
          attachment: fs.createReadStream(filePath)
        }, () => fs.unlinkSync(filePath)); // Delete after sending
      });

      writer.on("error", () => {
        message.reply("Download failed. The file may not be public or downloadable.");
      });

    } catch (e) {
      message.reply("Something went wrong: " + e.message);
    }
  }
};
