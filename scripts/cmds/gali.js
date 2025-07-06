 module.exports = {
  config: {
    name: "gali",
    aliases: ["gali", "insult"],
    version: "1.7",
    author: "rimon",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Sends a random Bangladeshi insult"
    },
    longDescription: {
      en: "Generates and sends a random Bangladeshi insult to roast someone playfully."
    },
    category: "fun",
    guide: {
      en: "{pn} [@mention] or reply to a message"
    }
  },

  onStart: async function ({ api, event }) {
    const insults = [
      "তোর মতো লোককে দেখে মশা-পিপঁড়ে আত্মহত্যা করতে চায়!",
      "তোর ঠোঁটে লিপস্টিক না, পেট্রোলের বোতল মাখা!",
      "তোর মুখ দেখে মনে হয় তুই লাইফে শুধু সেলফি তোলার জন্য জন্ম নিয়েছিস!",
      "তোর হাসির শব্দ শুনলে গাছও কাঁদে!",
      "তোর তো IQ টেস্টে হালকা শর্টকাট ইউজ করতে বলা ছিল!",
      "তুই তো এক নিকটবর্তী বাগানের পটেটো, কিছুই ভালো না!",
      "তোর ঘুমে রোজ অমৃত পান করে উঠে তুই এভাবে পাগল হয়ে যাবি!",
      "তোর বুদ্ধি একদম মাচার পোকামাকড়ের মতো, কিভাবে বাঁচে তাও জানি না!",
      "তুই তো এক খাকির পোল্যা, তোর কোনো কামেরই না!",
      "তুই এক হালার পুত, তোর মতো মানুষের জন্ম হওয়া উচিত ছিল না!"
      // আরও insult চাইলে লিস্টে বাড়াতে পারিস
    ];

    const randomInsult = insults[Math.floor(Math.random() * insults.length)];

    let targetID, targetName;

    if (event.messageReply) {
      targetID = event.messageReply.senderID;
      const userInfo = await api.getUserInfo(targetID);
      targetName = userInfo[targetID]?.name || "তুই";
    } else {
      return api.sendMessage("Reply কর কারে গালি দিবি!", event.threadID, event.messageID);
    }

    if (targetID === "100068909067279") {
      return api.sendMessage("kids?! this is my owner and your daddy 💀", event.threadID, event.messageID);
    }

    const arraytag = [{ id: targetID, tag: targetName }];
    const insultWithName = randomInsult.replace(/তুই/g, targetName).replace(/তোর/g, `${targetName}র`);

    return api.sendMessage({ body: `${insultWithName}`, mentions: arraytag }, event.threadID, event.messageID);
  }
};
