// Konfigurasi Chart.js
const ctx = document.getElementById('trafficChart').getContext('2d');
const maxDataPoints = 20;
const trafficChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Waktu/Timestamp
        datasets: [
            {
                label: 'Download (RX) - Mbps',
                borderColor: '#06b6d4', // Cyan
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                fill: true,
                data: [],
                tension: 0.4
            },
            {
                label: 'Upload (TX) - Mbps',
                borderColor: '#f43f5e', // Rose
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                fill: true,
                data: [],
                tension: 0.4
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
            y: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' }, beginAtZero: true }
        },
        plugins: {
            legend: { labels: { color: '#f3f4f6' } }
        }
    }
});

// Fungsi Helper Konversi bit ke Megabit (Mbps)
function bitsToMbps(bits) {
    return (bits / (1024 * 1024)).toFixed(2);
}

// 1. Fetch Resource Router (CPU, Memory, Uptime)
async function updateResources() {
    try {
        const response = await fetch('/api/resource');
        const res = await response.json();
        
        if (res.success) {
            const data = res.data;
            // Update UI
            document.getElementById('router-model').innerText = `${data.boardName} (v${data.version})`;
            document.getElementById('router-uptime').innerText = `Uptime: ${data.uptime}`;
            document.getElementById('cpu-text').innerText = `${data.cpuLoad}%`;
            document.getElementById('cpu-bar').style.width = `${data.cpuLoad}%`;
            
            const freeMem = (data.freeMemory / (1024 * 1024)).toFixed(1);
            const totalMem = (data.totalMemory / (1024 * 1024)).toFixed(1);
            document.getElementById('memory-text').innerText = `${freeMem} MB`;
            document.getElementById('memory-total').innerText = `Total: ${totalMem} MB`;
        }
    } catch (error) {
        console.error('Error fetching resources:', error);
    }
}

// 2. Fetch Traffic (Ubah 'ether1' sesuai interface internet router Anda)
async function updateTrafficChart() {
    try {
        const targetInterface = 'ether1'; 
        const response = await fetch(`/api/traffic/${targetInterface}`);
        const res = await response.json();

        if (res.success) {
            const now = new Date().toLocaleTimeString();
            const rxMbps = bitsToMbps(res.data.rx);
            const txMbps = bitsToMbps(res.data.tx);

            // Push data baru ke chart
            trafficChart.data.labels.push(now);
            trafficChart.data.datasets[0].data.push(rxMbps);
            trafficChart.data.datasets[1].data.push(txMbps);

            // Batasi jumlah titik grafik agar tidak terlalu padat
            if (trafficChart.data.labels.length > maxDataPoints) {
                trafficChart.data.labels.shift();
                trafficChart.data.datasets[0].data.shift();
                trafficChart.data.datasets[1].data.shift();
            }
            trafficChart.update();
        }
    } catch (error) {
        console.error('Error fetching traffic:', error);
    }
}

// 3. Fetch Data PPPoE Active
async function updatePPPoE() {
    try {
        const response = await fetch('/api/pppoe/active');
        const res = await response.json();

        if (res.success) {
            document.getElementById('pppoe-count').innerText = res.totalActive;
            
            const tableBody = document.getElementById('pppoe-table-body');
            tableBody.innerHTML = ''; // Clear table lama

            res.users.forEach(user => {
                const row = `
                    <tr class="hover:bg-gray-750 transition">
                        <td class="p-4 font-semibold text-teal-300">${user.name}</td>
                        <td class="p-4">${user.address}</td>
                        <td class="p-4 text-gray-400 font-mono text-xs">${user.callerId || '-'}</td>
                        <td class="p-4 text-sm text-gray-400">${user.uptime}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        }
    } catch (error) {
        console.error('Error fetching PPPoE data:', error);
    }
}

// Polling Engine (Interval)
// Eksekusi pertama kali saat halaman di-load
updateResources();
updateTrafficChart();
updatePPPoE();

// Set up interval update berkala
setInterval(updateResources, 5000);    // Resource update tiap 5 detik
setInterval(updateTrafficChart, 2000); // Grafik update tiap 2 detik (direkomendasikan untuk traffic)
setInterval(updatePPPoE, 10000);       // List PPPoE update tiap 10 detik