const { Client, RemoteAuth, Poll } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const express = require('express'); // Keeps server alive

// --- CONFIGURATION ---
const STUDENT_GROUP_ID = '120363404892113027@g.us'; 
const MONGO_URI = 'mongodb+srv://nexrael:SiDarth%401432@collegebot.mzgkhxi.mongodb.net/?appName=CollegeBot';

// MEMORY
let lastPollMessage = null;

// --- KEEP-ALIVE SERVER (For Render) ---
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('System is Online 🤖'));
app.listen(port, () => console.log(`Server running on port ${port}`));

// --- CONNECT TO DATABASE ---
mongoose.connect(MONGO_URI).then(() => {
    console.log('✅ Connected to MongoDB');
    
    const store = new MongoStore({ mongoose: mongoose });
    
    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', 
                '--disable-gpu'
            ]
        }
    });

    client.on('qr', (qr) => {
        console.log('📱 Scan this QR Code (Check Server Logs):');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('✅ SYSTEM V2.0 (SERVER) ONLINE');
    });

    client.on('remote_session_saved', () => {
        console.log('💾 Session Saved to Database');
    });

    // --- 🕕 6:00 PM IST: POLL ---
    cron.schedule('0 18 * * *', async () => {
        console.log('⏰ 6:00 PM Triggered.');
        await sendStudentPoll(client);
    }, { timezone: "Asia/Kolkata" });

    // --- 🕢 7:30 AM IST: SUMMARY ---
    cron.schedule('30 7 * * *', async () => {
        console.log('⏰ 7:30 AM: Generating Summary...');
        if (!lastPollMessage) {
            console.log('❌ No poll found.');
            return;
        }
        const summaryText = "🤖 *SYSTEM SUMMARY* 🤖\n\nPoll Closed. Check votes above.";
        await client.sendMessage(STUDENT_GROUP_ID, summaryText);
        lastPollMessage = null;
    }, { timezone: "Asia/Kolkata" });

    // HELPER FUNCTION
    async function sendStudentPoll(client) {
        const poll = new Poll(
            '🤖 *ATTENDANCE CHECK* 🤖\n\nPlan for tomorrow?', 
            ['Yes (Coming) 🗿', 'No (Side Quest) 😴', 'Maybe 🐈', 'bruhh you dumb bot 🤦 (clg band hai/chutti hai)'],
            { allowMultipleAnswers: false }
        );
        lastPollMessage = await client.sendMessage(STUDENT_GROUP_ID, poll);
        console.log('Poll Sent.');
    }

    client.initialize();
});


