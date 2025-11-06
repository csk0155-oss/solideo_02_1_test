"""
Flask Backend Server
Provides real-time system monitoring via WebSocket and PDF generation
"""

from flask import Flask, send_file, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import threading
import time
import os
from system_monitor import SystemMonitor
from pdf_generator import PDFGenerator

app = Flask(__name__)
app.config['SECRET_KEY'] = 'system-monitor-secret-key'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Global instances
monitor = SystemMonitor()
pdf_gen = PDFGenerator()
monitoring_active = False
monitoring_thread = None


def background_monitoring():
    """Background thread for collecting system data"""
    global monitoring_active

    while monitoring_active:
        data = monitor.get_all_info()
        socketio.emit('system_data', data, namespace='/')
        time.sleep(10)  # Collect data every 10 seconds


@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')
    emit('connection_response', {'status': 'connected'})


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')


@socketio.on('start_monitoring')
def handle_start_monitoring():
    """Start monitoring system resources"""
    global monitoring_active, monitoring_thread

    if not monitoring_active:
        monitoring_active = True
        monitor.clear_history()

        monitoring_thread = threading.Thread(target=background_monitoring)
        monitoring_thread.daemon = True
        monitoring_thread.start()

        emit('monitoring_status', {'status': 'started', 'message': 'Monitoring started'})
        print('Monitoring started')
    else:
        emit('monitoring_status', {'status': 'already_running', 'message': 'Monitoring already running'})


@socketio.on('stop_monitoring')
def handle_stop_monitoring():
    """Stop monitoring system resources"""
    global monitoring_active

    if monitoring_active:
        monitoring_active = False
        emit('monitoring_status', {'status': 'stopped', 'message': 'Monitoring stopped'})
        print('Monitoring stopped')
    else:
        emit('monitoring_status', {'status': 'already_stopped', 'message': 'Monitoring not running'})


@socketio.on('get_current_data')
def handle_get_current_data():
    """Get current system data on demand"""
    data = monitor.get_all_info()
    emit('system_data', data)


@app.route('/api/generate_pdf', methods=['POST'])
def generate_pdf():
    """Generate PDF report from collected data"""
    try:
        data_history = monitor.get_history()

        if not data_history:
            return jsonify({'error': 'No data available. Start monitoring first.'}), 400

        # Generate PDF
        pdf_path = os.path.join(os.path.dirname(__file__), 'system_report.pdf')
        pdf_gen.generate_report(data_history, pdf_path)

        return send_file(
            pdf_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'system_report_{int(time.time())}.pdf'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get monitoring status"""
    return jsonify({
        'monitoring_active': monitoring_active,
        'data_count': len(monitor.get_history())
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'System Monitor API'})


@app.route('/')
def index():
    """Root endpoint"""
    return jsonify({
        'service': 'System Resource Monitor API',
        'version': '1.0.0',
        'endpoints': {
            'websocket': 'ws://localhost:5001',
            'health': '/api/health',
            'status': '/api/status',
            'generate_pdf': '/api/generate_pdf (POST)'
        }
    })


if __name__ == '__main__':
    print("Starting System Monitor Server...")
    print("Server running on http://localhost:5001")
    socketio.run(app, host='0.0.0.0', port=5001, debug=True, allow_unsafe_werkzeug=True)
