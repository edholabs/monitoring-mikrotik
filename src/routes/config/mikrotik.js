const { RouterOSClient } = require('node-routeros');
const dotenv = require('dotenv');

dotenv.config();

// Fungsi untuk membuat koneksi baru ke MikroTik
async function getMikrotikClient() {
    const client = new RouterOSClient({
        host: process.env.MT_HOST,
        user: process.env.MT_USER,
        password: process.env.MT_PASS,
        port: parseInt(process.env.MT_PORT) || 8799,
        timeout: 5000
    });

    try {
        await client.connect();
        return client;
    } catch (error) {
        console.error('Gagal koneksi ke API MikroTik:', error.message);
        throw error;
    }
}

module.exports = { getMikrotikClient };