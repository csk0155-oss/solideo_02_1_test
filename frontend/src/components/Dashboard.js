import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard({ systemData, dataHistory }) {
  if (!systemData) {
    return (
      <div className="dashboard">
        <div className="no-data">
          <h2>No Data Available</h2>
          <p>Click "Start Monitoring" to begin collecting system data</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const getChartLabels = () => {
    return dataHistory.map((_, index) => {
      const secondsAgo = (dataHistory.length - 1 - index) * 10;
      return secondsAgo === 0 ? 'Now' : `-${secondsAgo}s`;
    });
  };

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
    }
  };

  // CPU Chart Data
  const cpuChartData = {
    labels: getChartLabels(),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: dataHistory.map(d => d.cpu.percent),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Memory Chart Data
  const memoryChartData = {
    labels: getChartLabels(),
    datasets: [
      {
        label: 'Memory Usage (%)',
        data: dataHistory.map(d => d.memory.virtual.percent),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Network Chart Data
  const networkChartData = {
    labels: getChartLabels(),
    datasets: [
      {
        label: 'Upload (KB/s)',
        data: dataHistory.map(d => d.network.speed.upload_kbps),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Download (KB/s)',
        data: dataHistory.map(d => d.network.speed.download_kbps),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Temperature Chart Data
  const tempChartData = {
    labels: getChartLabels(),
    datasets: [
      {
        label: 'CPU Temp (°C)',
        data: dataHistory.map(d => {
          if (d.temperature.cpu && d.temperature.cpu.length > 0) {
            return d.temperature.cpu[0].current || 0;
          }
          return 0;
        }),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'GPU Temp (°C)',
        data: dataHistory.map(d => {
          if (d.temperature.gpu && d.temperature.gpu.length > 0 && d.temperature.gpu[0].temperature) {
            return d.temperature.gpu[0].temperature;
          }
          return 0;
        }),
        borderColor: 'rgb(255, 205, 86)',
        backgroundColor: 'rgba(255, 205, 86, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card cpu">
          <h3>CPU</h3>
          <div className="stat-value">{systemData.cpu.percent.toFixed(1)}%</div>
          <div className="stat-detail">
            {systemData.cpu.core_count} Cores / {systemData.cpu.thread_count} Threads
          </div>
          <div className="stat-detail">
            {systemData.cpu.frequency.current.toFixed(0)} MHz
          </div>
        </div>

        <div className="stat-card memory">
          <h3>Memory</h3>
          <div className="stat-value">{systemData.memory.virtual.percent.toFixed(1)}%</div>
          <div className="stat-detail">
            {systemData.memory.virtual.used_gb} GB / {systemData.memory.virtual.total_gb} GB
          </div>
          <div className="stat-detail">
            Available: {systemData.memory.virtual.available_gb} GB
          </div>
        </div>

        <div className="stat-card disk">
          <h3>Disk</h3>
          {systemData.disk.partitions.length > 0 ? (
            <>
              <div className="stat-value">{systemData.disk.partitions[0].percent.toFixed(1)}%</div>
              <div className="stat-detail">
                {systemData.disk.partitions[0].used_gb} GB / {systemData.disk.partitions[0].total_gb} GB
              </div>
              <div className="stat-detail">
                {systemData.disk.partitions[0].mountpoint}
              </div>
            </>
          ) : (
            <div className="stat-value">N/A</div>
          )}
        </div>

        <div className="stat-card network">
          <h3>Network</h3>
          <div className="stat-value-small">
            <div>↑ {systemData.network.speed.upload_kbps.toFixed(2)} KB/s</div>
            <div>↓ {systemData.network.speed.download_kbps.toFixed(2)} KB/s</div>
          </div>
          <div className="stat-detail">
            Total: ↑ {systemData.network.total.mb_sent.toFixed(2)} MB
          </div>
          <div className="stat-detail">
            Total: ↓ {systemData.network.total.mb_recv.toFixed(2)} MB
          </div>
        </div>
      </div>

      {/* Temperature Cards */}
      {(systemData.temperature.cpu.length > 0 || systemData.temperature.gpu.length > 0) && (
        <div className="temp-grid">
          {systemData.temperature.cpu.length > 0 && systemData.temperature.cpu[0].current > 0 && (
            <div className="stat-card temp-cpu">
              <h3>CPU Temperature</h3>
              <div className="stat-value">{systemData.temperature.cpu[0].current.toFixed(1)}°C</div>
              <div className="stat-detail">{systemData.temperature.cpu[0].label}</div>
            </div>
          )}

          {systemData.temperature.gpu.length > 0 && systemData.temperature.gpu[0].temperature > 0 && (
            <div className="stat-card temp-gpu">
              <h3>GPU Temperature</h3>
              <div className="stat-value">{systemData.temperature.gpu[0].temperature.toFixed(1)}°C</div>
              <div className="stat-detail">{systemData.temperature.gpu[0].name}</div>
              {systemData.temperature.gpu[0].load !== undefined && (
                <div className="stat-detail">Load: {systemData.temperature.gpu[0].load.toFixed(1)}%</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      {dataHistory.length > 0 && (
        <div className="charts-container">
          <div className="chart-card">
            <h3>CPU Usage</h3>
            <div className="chart-wrapper">
              <Line data={cpuChartData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-card">
            <h3>Memory Usage</h3>
            <div className="chart-wrapper">
              <Line data={memoryChartData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-card">
            <h3>Network Speed</h3>
            <div className="chart-wrapper">
              <Line data={networkChartData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-card">
            <h3>Temperature</h3>
            <div className="chart-wrapper">
              <Line data={tempChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Detailed Tables */}
      <div className="tables-container">
        <div className="table-card">
          <h3>CPU Details</h3>
          <table>
            <tbody>
              <tr>
                <td>Overall Usage</td>
                <td>{systemData.cpu.percent.toFixed(2)}%</td>
              </tr>
              <tr>
                <td>Physical Cores</td>
                <td>{systemData.cpu.core_count}</td>
              </tr>
              <tr>
                <td>Logical Threads</td>
                <td>{systemData.cpu.thread_count}</td>
              </tr>
              <tr>
                <td>Current Frequency</td>
                <td>{systemData.cpu.frequency.current.toFixed(2)} MHz</td>
              </tr>
              <tr>
                <td>Max Frequency</td>
                <td>{systemData.cpu.frequency.max.toFixed(2)} MHz</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="table-card">
          <h3>Memory Details</h3>
          <table>
            <tbody>
              <tr>
                <td>Total RAM</td>
                <td>{systemData.memory.virtual.total_gb} GB</td>
              </tr>
              <tr>
                <td>Used RAM</td>
                <td>{systemData.memory.virtual.used_gb} GB ({systemData.memory.virtual.percent.toFixed(1)}%)</td>
              </tr>
              <tr>
                <td>Available RAM</td>
                <td>{systemData.memory.virtual.available_gb} GB</td>
              </tr>
              <tr>
                <td>Swap Total</td>
                <td>{systemData.memory.swap.total_gb} GB</td>
              </tr>
              <tr>
                <td>Swap Used</td>
                <td>{systemData.memory.swap.used_gb} GB ({systemData.memory.swap.percent.toFixed(1)}%)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {systemData.disk.partitions.length > 0 && (
          <div className="table-card">
            <h3>Disk Details</h3>
            <table>
              <tbody>
                {systemData.disk.partitions.map((partition, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td colSpan="2" style={{fontWeight: 'bold', background: 'rgba(255,255,255,0.1)'}}>
                        {partition.mountpoint}
                      </td>
                    </tr>
                    <tr>
                      <td>Device</td>
                      <td>{partition.device}</td>
                    </tr>
                    <tr>
                      <td>Total</td>
                      <td>{partition.total_gb} GB</td>
                    </tr>
                    <tr>
                      <td>Used</td>
                      <td>{partition.used_gb} GB ({partition.percent.toFixed(1)}%)</td>
                    </tr>
                    <tr>
                      <td>Free</td>
                      <td>{partition.free_gb} GB</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
