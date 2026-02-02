const { default: makeWASocket, useMultiFileAuthState, Browsers, jidDecode } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs-extra");
const axios = require("axios");
require("./config");

async function startAwaisBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    const client = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop")
    });

    client.ev.on("creds.update", saveCreds);

    client.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const type = Object.keys(msg.message)[0];
        const body = (type === 'conversation') ? msg.message.conversation : (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : '';
        const sender = msg.key.participant || msg.key.remoteJid;
        
        const prefix = ".";
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : "";
        const args = body.trim().split(/ +/).slice(1);

        // --- Auto React Feature ---
        if (global.autoReact && body && !isCmd) {
            await client.sendMessage(from, { react: { text: "🦾", key: msg.key } });
        }

        if (!isCmd) return;

        switch (command) {
            case 'menu':
                const menuText = `
┏━━━━『 💀 *${global.botName}* *👑 』━━━━
┃
┃ 🕒 *Status:* Online & Secure
┃ 👤 *User:* @${sender.split('@')[0]}
┃ ⚙️ *React:* ${global.autoReact ? "ON" : "OFF"}
┃
┣━━━『 📥 *DOWNLOADER* 』━━━
┃ ┠ .tt <link> (TikTok No Watermark)
┃ ┠ .fb <link> (Facebook Video)
┃
┣━━━『 🤖 *AI & MAGIC* 』━━━
┃ ┠ .ai <question> (Education AI)
┃ ┠ .react on/off (Toggle React)
┃ ┠ .hidetag (Admin Only)
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚡ *OWNER: AWAIS MAYO* ⚡`;

                await client.sendMessage(from, { 
                    image: { url: global.menuImage }, 
                    caption: menuText,
                    mentions: [sender]
                });
                break;

            case 'react':
                if (args[0] === 'on') {
                    global.autoReact = true;
                    await client.sendMessage(from, { text: "✅ Auto-React is now ON" });
                } else if (args[0] === 'off') {
                    global.autoReact = false;
                    await client.sendMessage(from, { text: "❌ Auto-React is now OFF" });
                }
                break;

            case 'tt':
            case 'tiktok':
                if (!args[0]) return client.sendMessage(from, { text: "Please send a TikTok link!" });
                await client.sendMessage(from, { text: global.mess.wait });
                try {
                    // TikTok API Integration
                    const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${args[0]}`);
                    const videoUrl = res.data.video.noWatermark;
                    await client.sendMessage(from, { video: { url: videoUrl }, caption: "Done By Awais Mayo 👑" });
                } catch (e) {
                    await client.sendMessage(from, { text: "❌ API Error or Invalid Link!" });
                }
                break;

            case 'hidetag':
                // Admin check logic can be added here
                const groupMetadata = await client.groupMetadata(from);
                const participants = groupMetadata.participants;
                await client.sendMessage(from, { text: args.join(" ") || "Attention Everyone!", mentions: participants.map(a => a.id) });
                break;
        }
    });

    // Auto Status Viewer
    client.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (m.key.remoteJid === 'status@broadcast' && global.autoStatus) {
            await client.readMessages([m.key]);
        }
    });
}

startAwaisBot();
                                                             
