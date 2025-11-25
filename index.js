// -----------------------------
// Imports and setup
// -----------------------------
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

// -----------------------------
// Google Sheets setup
// -----------------------------
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets"]
);

const sheets = google.sheets({ version: "v4", auth });

// -----------------------------
// Function to append a row
// -----------------------------
async function appendRow(row) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1",
      valueInputOption: "USER_ENTERED",
      resource: { values: [row] }
    });
    console.log("Row appended:", row);
  } catch (err) {
    console.error("Error appending row:", err.message);
  }
}

// -----------------------------
// Start WhatsApp bot
// -----------------------------
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./sessions/zuku");

  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  // Listen to messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    // Group check
    const isGroup = msg.key.remoteJid.endsWith("@g.us");
    const groupId = msg.key.remoteJid;

    // OPTIONAL — only listen to Zuku group:
    // if (groupId !== process.env.ZUKU_GROUP_ID) return;

    const sender = msg.pushName || "Unknown";
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    // Parse Drop / ONU / ATB
    const dropMatch = text.match(/drop\s*(\d+)/i);
    const onuMatch = text.match(/onu\s*(\d+)/i);
    const atbMatch = text.match(/atb\s*(\d+)/i);

    if (!dropMatch && !onuMatch && !atbMatch) return;

    const row = [
      new Date().toLocaleString("en-KE"),
      sender,
      dropMatch ? dropMatch[1] : "",
      onuMatch ? onuMatch[1] : "",
      atbMatch ? atbMatch[1] : "",
      text // full note
    ];

    await appendRow(row);
  });
}

// -----------------------------
// Run the bot
// -----------------------------
startBot();