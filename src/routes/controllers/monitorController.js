const { getMikrotikClient } = require('../config/mikrotik.js');

// 1. Ambil Resource Router (CPU, Memory, Uptime)
exports.getSystemResource = async (req, res) => {
    let client;
    try {
        client = await getMikrotikClient();
        const resources = await client.menu('/system/resource').print();
        
        // Ambil objek pertama dari array response
        const data = resources[0];
        res.json({
            success: true,
            data: {
                uptime: data.uptime,
                cpuLoad: parseInt(data['cpu-load']),
                freeMemory: parseInt(data['free-memory']),
                totalMemory: parseInt(data['total-memory']),
                version: data.version,
                boardName: data['board-name']
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (client) client.close(); // Selalu tutup koneksi API setelah selesai
    }
};

// 2. Ambil Traffic Interface secara Real-time
exports.getInterfaceTraffic = async (req, res) => {
    const { interfaceName } = req.params; // contoh: ether1, wlan1, atau pppoe-out1
    let client;
    try {
        client = await getMikrotikClient();
        // Menggunakan monitor-traffic sekali ambil (once)
        const traffic = await client.menu('/interface').exec('monitor-traffic', {
            interface: interfaceName,
            once: true
        });

        res.json({
            success: true,
            data: {
                interface: interfaceName,
                rx: parseInt(traffic[0]['rx-bits-per-second']) || 0,
                tx: parseInt(traffic[0]['tx-bits-per-second']) || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (client) client.close();
    }
};

// 3. Ambil Status Pelanggan PPPoE Active
exports.getPPPoEActive = async (req, res) => {
    let client;
    try {
        client = await getMikrotikClient();
        const activeUsers = await client.menu('/ppp/active').print();
        
        // Format data agar lebih bersih untuk dibaca frontend
        const formattedUsers = activeUsers.map(user => ({
            id: user['.id'],
            name: user.name,
            service: user.service,
            callerId: user['caller-id'], // Mac Address / VLAN
            address: user.address,       // IP yang didapat pelanggan
            uptime: user.uptime
        }));

        res.json({
            success: true,
            totalActive: formattedUsers.length,
            users: formattedUsers
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (client) client.close();
    }
};