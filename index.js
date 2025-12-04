const { Client, LocalAuth, Poll } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

// --- CONFIGURATION ---
const STUDENT_GROUP_ID = '120363404892113027@g.us'; 

// 1. FIX: Define the memory variable here
let lastPollMessage = null;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true,
        args: ['--no-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('📱 Scan this QR Code with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ SYSTEM V1.0 ONLINE');
    console.log('Type "!test" in the group to fire a test poll.');
});

// --- 🕕 6:00 PM: STUDENT POLL (Daily) ---
cron.schedule('0 18 * * *', async () => {
    console.log('⏰ 6:00 PM IST Triggered.');
    await sendStudentPoll();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" 
});

// --- 🕢 7:30 AM: SEND SUMMARY ---
// Updated to 30 7 (7:30 AM)
cron.schedule('30 7 * * *', async () => {
    console.log('⏰ 7:30 AM: Generating Summary...');

    if (!lastPollMessage) {
        console.log('❌ No poll found in memory (Bot was restarted?)');
        return;
    }
    
    const summaryText = "🤖 *SYSTEM SUMMARY* 🤖\n\nPoll Closed.\nCheck the votes above before you leave for college.\n\n(If < 5 people are coming, mass bunk initiated? 🌚)";
    
    await client.sendMessage(STUDENT_GROUP_ID, summaryText);
    console.log('Summary Sent.');
    
    // Clear memory for the next day
    lastPollMessage = null;

}, { timezone: "Asia/Kolkata" });

// --- FUNCTION TO SEND THE POLL ---
async function sendStudentPoll() {
    const poll = new Poll(
        '🤖 *ATTENDANCE CHECK* 🤖\n\nPlan for tomorrow?', 
        [
            'Yes (Coming) 🗿', 
            'No (Side Quest) 😴', 
            'Maybe (Depends on Mood) 🐈'
        ],
        { allowMultipleAnswers: false }
    );

    // 3. FIX: Save the message to the variable!
    lastPollMessage = await client.sendMessage(STUDENT_GROUP_ID, poll);
    console.log('Poll Sent and Saved to Memory.');
}

// --- 🛠 HELPER TOOLS ---
client.on('message', async (msg) => {
    if (msg.body === '!id') {
        const chat = await msg.getChat();
        console.log(`\n--- GROUP INFO ---\nName: ${chat.name}\nID: ${chat.id._serialized}\n------------------\n`);
    }

    if (msg.body === '!test') {
        if (msg.from === STUDENT_GROUP_ID) { 
            await msg.reply('Testing System...');
            await sendStudentPoll();
        }
    }
});

client.initialize();