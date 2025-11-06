import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import './App.css';

const BACKEND_URL = 'http://localhost:5000';

function App() {
  const [socket, setSocket] = useState(null);
  const [systemData, setSystemData] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [dataHistory, setDataHistory] = useState([]);
  const [monitoringTime, setMonitoringTime] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const timerRef = useRef(null);
  const autoStopRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connection_response', (data) => {
      console.log('Connection response:', data);
    });

    newSocket.on('system_data', (data) => {
      console.log('Received system data');
      setSystemData(data);
      setDataHistory(prev => {
        const newHistory = [...prev, data];
        // Keep only last 18 entries (3 minutes at 10 second intervals)
        if (newHistory.length > 18) {
          return newHistory.slice(-18);
        }
        return newHistory;
      });
    });

    newSocket.on('monitoring_status', (data) => {
      console.log('Monitoring status:', data);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (autoStopRef.current) {
        clearTimeout(autoStopRef.current);
      }
    };
  }, []);

  const startMonitoring = () => {
    if (socket) {
      socket.emit('start_monitoring');
      setIsMonitoring(true);
      setMonitoringTime(0);
      setDataHistory([]);

      // Start timer
      timerRef.current = setInterval(() => {
        setMonitoringTime(prev => prev + 1);
      }, 1000);

      // Auto-stop after 5 minutes (300 seconds)
      autoStopRef.current = setTimeout(() => {
        stopMonitoring();
      }, 300000);
    }
  };

  const stopMonitoring = () => {
    if (socket) {
      socket.emit('stop_monitoring');
      setIsMonitoring(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (autoStopRef.current) {
        clearTimeout(autoStopRef.current);
      }
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/generate_pdf`, {}, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system_report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Make sure monitoring has been started and data is available.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>System Resource Monitor</h1>
        <div className="header-info">
          <div className={`connection-status ${connectionStatus}`}>
            <span className="status-dot"></span>
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </div>
          <div className="monitoring-time">
            Time: {formatTime(monitoringTime)} / 05:00
          </div>
        </div>
      </header>

      <div className="controls">
        <button
          className={`btn ${isMonitoring ? 'btn-danger' : 'btn-success'}`}
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          disabled={connectionStatus !== 'connected'}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
        <button
          className="btn btn-primary"
          onClick={downloadPDF}
          disabled={dataHistory.length === 0}
        >
          Download PDF Report
        </button>
        <div className="data-info">
          Data Points: {dataHistory.length}
        </div>
      </div>

      <Dashboard systemData={systemData} dataHistory={dataHistory} />

      <footer className="App-footer">
        <p>Monitoring Interval: 10 seconds | Display Window: 3 minutes (last 18 data points)</p>
        <p>Auto-stop: 5 minutes from start</p>
      </footer>
    </div>
  );
}

export default App;
