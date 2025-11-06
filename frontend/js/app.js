// Global variables
const BACKEND_URL = 'http://localhost:5001';
let socket = null;
let systemData = null;
let dataHistory = [];
let isMonitoring = false;
let monitoringTime = 0;
let timerInterval = null;
let autoStopTimeout = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    connectToServer();
    initCharts();
});

// Connect to WebSocket server
function connectToServer() {
    socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus(true);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
    });

    socket.on('connection_response', (data) => {
        console.log('Connection response:', data);
    });

    socket.on('system_data', (data) => {
        console.log('Received system data');
        systemData = data;

        // Add to history (keep last 18 entries - 3 minutes)
        dataHistory.push(data);
        if (dataHistory.length > 18) {
            dataHistory.shift();
        }

        updateUI(data);
        updateCharts(dataHistory);

        // Update data count
        document.getElementById('dataCount').textContent = dataHistory.length;

        // Enable PDF button if we have data
        document.getElementById('downloadBtn').disabled = dataHistory.length === 0;
    });

    socket.on('monitoring_status', (data) => {
        console.log('Monitoring status:', data);
    });
}

// Update connection status indicator
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');

    if (connected) {
        statusEl.classList.add('connected');
        statusEl.classList.remove('disconnected');
        statusText.textContent = 'Connected';
    } else {
        statusEl.classList.remove('connected');
        statusEl.classList.add('disconnected');
        statusText.textContent = 'Disconnected';
    }
}

// Start monitoring
function startMonitoring() {
    if (!socket) {
        alert('Not connected to server');
        return;
    }

    socket.emit('start_monitoring');
    isMonitoring = true;
    monitoringTime = 0;
    dataHistory = [];

    // Update UI
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'inline-block';
    document.getElementById('noData').style.display = 'none';
    document.getElementById('statsGrid').style.display = 'grid';
    document.getElementById('chartsContainer').style.display = 'grid';
    document.getElementById('tablesContainer').style.display = 'grid';

    // Start timer
    timerInterval = setInterval(() => {
        monitoringTime++;
        updateTimerDisplay();
    }, 1000);

    // Auto-stop after 5 minutes (300 seconds)
    autoStopTimeout = setTimeout(() => {
        stopMonitoring();
    }, 300000);
}

// Stop monitoring
function stopMonitoring() {
    if (!socket) return;

    socket.emit('stop_monitoring');
    isMonitoring = false;

    // Update UI
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('stopBtn').style.display = 'none';

    // Clear timers
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (autoStopTimeout) {
        clearTimeout(autoStopTimeout);
        autoStopTimeout = null;
    }
}

// Update timer display
function updateTimerDisplay() {
    const mins = Math.floor(monitoringTime / 60);
    const secs = monitoringTime % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('monitoringTime').textContent = timeStr;
}

// Update UI with system data
function updateUI(data) {
    if (!data) return;

    // CPU
    document.getElementById('cpuPercent').textContent = data.cpu.percent.toFixed(1) + '%';
    document.getElementById('cpuCores').textContent =
        `${data.cpu.core_count} Cores / ${data.cpu.thread_count} Threads`;
    document.getElementById('cpuFreq').textContent =
        `${data.cpu.frequency.current.toFixed(0)} MHz`;

    // Memory
    document.getElementById('memPercent').textContent =
        data.memory.virtual.percent.toFixed(1) + '%';
    document.getElementById('memUsage').textContent =
        `${data.memory.virtual.used_gb} GB / ${data.memory.virtual.total_gb} GB`;
    document.getElementById('memAvailable').textContent =
        `Available: ${data.memory.virtual.available_gb} GB`;

    // Disk
    if (data.disk.partitions.length > 0) {
        const disk = data.disk.partitions[0];
        document.getElementById('diskPercent').textContent = disk.percent.toFixed(1) + '%';
        document.getElementById('diskUsage').textContent =
            `${disk.used_gb} GB / ${disk.total_gb} GB`;
        document.getElementById('diskMount').textContent = disk.mountpoint;
    }

    // Network
    document.getElementById('netUpload').textContent =
        `↑ ${data.network.speed.upload_kbps.toFixed(2)} KB/s`;
    document.getElementById('netDownload').textContent =
        `↓ ${data.network.speed.download_kbps.toFixed(2)} KB/s`;
    document.getElementById('netTotalUp').textContent =
        `Total: ↑ ${data.network.total.mb_sent.toFixed(2)} MB`;
    document.getElementById('netTotalDown').textContent =
        `Total: ↓ ${data.network.total.mb_recv.toFixed(2)} MB`;

    // Temperature
    if (data.temperature.cpu.length > 0 && data.temperature.cpu[0].current > 0) {
        document.getElementById('tempGrid').style.display = 'grid';
        document.getElementById('cpuTempCard').style.display = 'block';
        document.getElementById('cpuTemp').textContent =
            data.temperature.cpu[0].current.toFixed(1) + '°C';
        document.getElementById('cpuTempLabel').textContent =
            data.temperature.cpu[0].label;
    }

    if (data.temperature.gpu.length > 0 && data.temperature.gpu[0].temperature > 0) {
        document.getElementById('tempGrid').style.display = 'grid';
        document.getElementById('gpuTempCard').style.display = 'block';
        document.getElementById('gpuTemp').textContent =
            data.temperature.gpu[0].temperature.toFixed(1) + '°C';
        document.getElementById('gpuName').textContent =
            data.temperature.gpu[0].name;
        if (data.temperature.gpu[0].load !== undefined) {
            document.getElementById('gpuLoad').textContent =
                `Load: ${data.temperature.gpu[0].load.toFixed(1)}%`;
        }
    }

    // Update detailed tables
    updateDetailedTables(data);
}

// Update detailed tables
function updateDetailedTables(data) {
    // CPU Details
    document.getElementById('cpuDetailPercent').textContent =
        data.cpu.percent.toFixed(2) + '%';
    document.getElementById('cpuDetailCores').textContent = data.cpu.core_count;
    document.getElementById('cpuDetailThreads').textContent = data.cpu.thread_count;
    document.getElementById('cpuDetailFreq').textContent =
        data.cpu.frequency.current.toFixed(2) + ' MHz';
    document.getElementById('cpuDetailMaxFreq').textContent =
        data.cpu.frequency.max.toFixed(2) + ' MHz';

    // Memory Details
    document.getElementById('memDetailTotal').textContent =
        data.memory.virtual.total_gb + ' GB';
    document.getElementById('memDetailUsed').textContent =
        `${data.memory.virtual.used_gb} GB (${data.memory.virtual.percent.toFixed(1)}%)`;
    document.getElementById('memDetailAvail').textContent =
        data.memory.virtual.available_gb + ' GB';
    document.getElementById('memDetailSwapTotal').textContent =
        data.memory.swap.total_gb + ' GB';
    document.getElementById('memDetailSwapUsed').textContent =
        `${data.memory.swap.used_gb} GB (${data.memory.swap.percent.toFixed(1)}%)`;

    // Disk Details
    if (data.disk.partitions.length > 0) {
        const tbody = document.getElementById('diskTableBody');
        tbody.innerHTML = '';

        data.disk.partitions.forEach((partition, index) => {
            tbody.innerHTML += `
                <tr>
                    <td colspan="2" style="font-weight: bold; background: rgba(255,255,255,0.1);">
                        ${partition.mountpoint}
                    </td>
                </tr>
                <tr><td>Device</td><td>${partition.device}</td></tr>
                <tr><td>Total</td><td>${partition.total_gb} GB</td></tr>
                <tr><td>Used</td><td>${partition.used_gb} GB (${partition.percent.toFixed(1)}%)</td></tr>
                <tr><td>Free</td><td>${partition.free_gb} GB</td></tr>
            `;
        });
    }
}

// Download PDF report
async function downloadPDF() {
    if (dataHistory.length === 0) {
        alert('No data available. Start monitoring first.');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/generate_pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system_report_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Failed to generate PDF. Make sure monitoring has been started and data is available.');
    }
}
