const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const net = require('net');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Konfigurasi dari .env
const MT_HOST = process.env.MT_HOST || '172.21.0.1';
const MT_USER = process.env.MT_USER || 'zafalink101';
const MT_PASS = process.env.MT_PASS || 'Gorontal0123';
const MT_PORT = parseInt(process.env.MT_PORT) || 8799;

// ==========================================
// DRIVER API MIKROTIK MURNI VIA TCP SOCKET (FIXED)
// ==========================================
function sendApiCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        let buffer = Buffer.alloc(0);
        let currentSentence = [];
        let allSentences = [];
        let loginSuccessful = false;

        // Helper untuk encode panjang string sesuai protokol API MikroTik
        function encodeLength(len) {
            if (len < 0x80) return Buffer.from([len]);
            if (len < 0x4000) return Buffer.from([(len >> 8) | 0x80, len & 0xFF]);
            if (len < 0x200000) return Buffer.from([(len >> 16) | 0xC0, (len >> 8) & 0xFF, len & 0xFF]);
            return Buffer.from([(len >> 24) | 0xE0, (len >> 16) & 0xFF, (len >> 8) & 0xFF, len & 0xFF]);
        }

        // Fungsi kirim kata (word) ke socket
        function sendWord(word) {
            const bWord = Buffer.from(word, 'utf8');
            socket.write(encodeLength(bWord.length));
            socket.write(bWord);
        }

        socket.setTimeout(5000); // Naikkan ke 5 detik agar lebih aman
        socket.connect(MT_PORT, MT_HOST, () => {
            // Alur login API MikroTik v6.43+ / v7 modern langsung kirim credentials
            sendWord('/login');
            sendWord('=name=' + MT_USER);
            sendWord('=password=' + MT_PASS);
            sendWord(''); // End of sentence login
        });

        socket.on('data', (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);
            
            while (buffer.length > 0) {
                let offset = 0;
                let b = buffer[offset++];
                let len = 0;

                if ((b & 0x80) === 0x00) len = b;
                else if ((b & 0xC0) === 0x80) { if(buffer.length < 2) break; len = ((b & 0x3F) << 8) | buffer[offset++]; }
                else if ((b & 0xE0) === 0xC0) { if(buffer.length < 3) break; len = ((b & 0x1F) << 16) | (buffer[offset++] << 8) | buffer[offset++]; }
                else { if(buffer.length < 4) break; len = ((b & 0x0F) << 24) | (buffer[offset++] << 16) | (buffer[offset++] << 8) | buffer[offset++]; }

                if (buffer.length < offset + len) break;

                const word = buffer.toString('utf8', offset, offset + len);
                buffer = buffer.subarray(offset + len);
                
                if (word === '') {
                    // Akhir dari sebuah baris/sentence (!done, !re, !trap)
                    if (currentSentence.length > 0) {
                        const type = currentSentence[0];

                        if (type === '!trap') {
                            socket.destroy();
                            return reject(new Error('Kredensial salah, akses ditolak, atau syntax perintah MikroTik salah.'));
                        }
                        
                        // Handler jika login sukses
                        if (!loginSuccessful && type === '!done') {
                            loginSuccessful = true;
                            currentSentence = [];
                            // Kirim perintah asli setelah login sukses
                            sendWord(command);
                            args.forEach(arg => sendWord(arg));
                            sendWord('');
                            continue;
                        }

                        // Simpan kalimat respon untuk perintah asli
                        if (loginSuccessful) {
                            allSentences.push(currentSentence);
                            
                            // Jika perintah utama selesai (!done)
                            if (type === '!done') {
                                socket.destroy();
                                
                                const results = [];
                                let currentObj = {};

                                allSentences.forEach(sentence => {
                                    const sType = sentence[0];
                                    if (sType === '!re') {
                                        currentObj = {};
                                        sentence.slice(1).forEach(l => {
                                            if (l.startsWith('=')) {
                                                const parts = l.substring(1).split('=');
                                                const key = parts[0];
                                                const val = parts.slice(1).join('=');
                                                currentObj[key] = val;
                                            }
                                        });
                                        if (Object.keys(currentObj).length > 0) {
                                            results.push(currentObj);
                                        }
                                    }
                                });
                                
                                return resolve(results);
                            }
                        }
                    }
                    currentSentence = [];
                } else {
                    currentSentence.push(word);
                }
            }
        });

        socket.on('timeout', () => { socket.destroy(); reject(new Error('Koneksi ke MikroTik Timeout.')); });
        socket.on('error', (err) => { socket.destroy(); reject(err); });
    });
}

// ==========================================
// ROUTE WEB UTAMA
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// ==========================================
// ENDPOINT REST API UNTUK DASHBOARD
// ==========================================

// 1. Resource Router
app.get('/api/resource', async (req, res) => {
    try {
        const resources = await sendApiCommand('/system/resource/print');
        if (resources && resources.length > 0) {
            const data = resources[0];
            res.json({
                success: true,
                data: {
                    uptime: data.uptime || '--',
                    cpuLoad: parseInt(data['cpu-load']) || 0,
                    freeMemory: parseInt(data['free-memory']) || 0,
                    totalMemory: parseInt(data['total-memory']) || 0,
                    version: data.version || 'Unknown',
                    boardName: data['board-name'] || 'Router'
                }
            });
        } else {
            throw new Error('Tidak ada respon data resource');
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Traffic Interface
app.get('/api/traffic/:interfaceName', async (req, res) => {
    const { interfaceName } = req.params;
    try {
        const traffic = await sendApiCommand('/interface/monitor-traffic', [
            '=interface=' + interfaceName,
            '=once='
        ]);
        if (traffic && traffic.length > 0) {
            res.json({
                success: true,
                data: {
                    interface: interfaceName,
                    rx: parseInt(traffic[0]['rx-bits-per-second']) || 0,
                    tx: parseInt(traffic[0]['tx-bits-per-second']) || 0
                }
            });
        } else {
            res.json({ success: true, data: { interface: interfaceName, rx: 0, tx: 0 } });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. PPPoE Active Users
app.get('/api/pppoe/active', async (req, res) => {
    try {
        const activeUsers = await sendApiCommand('/ppp/active/print');
        const formattedUsers = (activeUsers || []).map(user => ({
            id: user['.id'] || '',
            name: user.name || 'Unknown',
            service: user.service || 'pppoe',
            callerId: user['caller-id'] || '',
            address: user.address || '',
            uptime: user.uptime || ''
        }));
        res.json({
            success: true,
            totalActive: formattedUsers.length,
            users: formattedUsers
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 ZAFALINK Monitor berjalan kokoh di http://localhost:${PORT}`);
});