// Chart Management
let cpuChart = null;
let memoryChart = null;
let networkChart = null;
let temperatureChart = null;

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'top',
            labels: {
                color: '#fff',
                font: {
                    size: 12
                }
            }
        },
        tooltip: {
            mode: 'index',
            intersect: false,
        }
    },
    scales: {
        x: {
            ticks: { color: '#fff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        y: {
            ticks: { color: '#fff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
    },
    animation: {
        duration: 750
    }
};

function initCharts() {
    // CPU Chart
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    cpuChart = new Chart(cpuCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CPU Usage (%)',
                data: [],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: chartOptions
    });

    // Memory Chart
    const memCtx = document.getElementById('memoryChart').getContext('2d');
    memoryChart = new Chart(memCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Memory Usage (%)',
                data: [],
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: chartOptions
    });

    // Network Chart
    const netCtx = document.getElementById('networkChart').getContext('2d');
    networkChart = new Chart(netCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Upload (KB/s)',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Download (KB/s)',
                    data: [],
                    borderColor: 'rgb(153, 102, 255)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: chartOptions
    });

    // Temperature Chart
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');
    temperatureChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'CPU Temp (°C)',
                    data: [],
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'GPU Temp (°C)',
                    data: [],
                    borderColor: 'rgb(255, 205, 86)',
                    backgroundColor: 'rgba(255, 205, 86, 0.2)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: chartOptions
    });
}

function getChartLabels(dataHistory) {
    return dataHistory.map((_, index) => {
        const secondsAgo = (dataHistory.length - 1 - index) * 10;
        return secondsAgo === 0 ? 'Now' : `-${secondsAgo}s`;
    });
}

function updateCharts(dataHistory) {
    if (!dataHistory || dataHistory.length === 0) return;

    const labels = getChartLabels(dataHistory);

    // Update CPU Chart
    cpuChart.data.labels = labels;
    cpuChart.data.datasets[0].data = dataHistory.map(d => d.cpu.percent);
    cpuChart.update('none'); // 'none' for no animation

    // Update Memory Chart
    memoryChart.data.labels = labels;
    memoryChart.data.datasets[0].data = dataHistory.map(d => d.memory.virtual.percent);
    memoryChart.update('none');

    // Update Network Chart
    networkChart.data.labels = labels;
    networkChart.data.datasets[0].data = dataHistory.map(d => d.network.speed.upload_kbps);
    networkChart.data.datasets[1].data = dataHistory.map(d => d.network.speed.download_kbps);
    networkChart.update('none');

    // Update Temperature Chart
    temperatureChart.data.labels = labels;
    temperatureChart.data.datasets[0].data = dataHistory.map(d => {
        if (d.temperature.cpu && d.temperature.cpu.length > 0) {
            return d.temperature.cpu[0].current || 0;
        }
        return 0;
    });
    temperatureChart.data.datasets[1].data = dataHistory.map(d => {
        if (d.temperature.gpu && d.temperature.gpu.length > 0 && d.temperature.gpu[0].temperature) {
            return d.temperature.gpu[0].temperature;
        }
        return 0;
    });
    temperatureChart.update('none');
}
