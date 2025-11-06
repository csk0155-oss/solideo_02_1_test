"""
System Resource Monitor
Collects CPU, Memory, Disk, Network, and Temperature data
"""

import psutil
import time
from datetime import datetime
from typing import Dict, List

try:
    import GPUtil
    GPU_AVAILABLE = True
except:
    GPU_AVAILABLE = False


class SystemMonitor:
    def __init__(self):
        self.network_io_last = psutil.net_io_counters()
        self.last_check_time = time.time()
        self.data_history = []

    def get_cpu_info(self) -> Dict:
        """Get CPU usage and frequency information"""
        cpu_percent = psutil.cpu_percent(interval=0.1, percpu=True)
        cpu_freq = psutil.cpu_freq()

        return {
            'percent': psutil.cpu_percent(interval=0.1),
            'percent_per_core': cpu_percent,
            'core_count': psutil.cpu_count(logical=False),
            'thread_count': psutil.cpu_count(logical=True),
            'frequency': {
                'current': cpu_freq.current if cpu_freq else 0,
                'min': cpu_freq.min if cpu_freq else 0,
                'max': cpu_freq.max if cpu_freq else 0
            }
        }

    def get_memory_info(self) -> Dict:
        """Get memory usage information"""
        virtual_mem = psutil.virtual_memory()
        swap_mem = psutil.swap_memory()

        return {
            'virtual': {
                'total': virtual_mem.total,
                'available': virtual_mem.available,
                'used': virtual_mem.used,
                'percent': virtual_mem.percent,
                'total_gb': round(virtual_mem.total / (1024**3), 2),
                'used_gb': round(virtual_mem.used / (1024**3), 2),
                'available_gb': round(virtual_mem.available / (1024**3), 2)
            },
            'swap': {
                'total': swap_mem.total,
                'used': swap_mem.used,
                'percent': swap_mem.percent,
                'total_gb': round(swap_mem.total / (1024**3), 2),
                'used_gb': round(swap_mem.used / (1024**3), 2)
            }
        }

    def get_disk_info(self) -> Dict:
        """Get disk usage information"""
        partitions = psutil.disk_partitions()
        disk_info = []

        for partition in partitions:
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disk_info.append({
                    'device': partition.device,
                    'mountpoint': partition.mountpoint,
                    'fstype': partition.fstype,
                    'total': usage.total,
                    'used': usage.used,
                    'free': usage.free,
                    'percent': usage.percent,
                    'total_gb': round(usage.total / (1024**3), 2),
                    'used_gb': round(usage.used / (1024**3), 2),
                    'free_gb': round(usage.free / (1024**3), 2)
                })
            except PermissionError:
                continue

        # Disk IO
        disk_io = psutil.disk_io_counters()
        io_info = {
            'read_bytes': disk_io.read_bytes if disk_io else 0,
            'write_bytes': disk_io.write_bytes if disk_io else 0,
            'read_mb': round(disk_io.read_bytes / (1024**2), 2) if disk_io else 0,
            'write_mb': round(disk_io.write_bytes / (1024**2), 2) if disk_io else 0
        }

        return {
            'partitions': disk_info,
            'io': io_info
        }

    def get_network_info(self) -> Dict:
        """Get network usage information"""
        current_time = time.time()
        time_delta = current_time - self.last_check_time

        network_io_current = psutil.net_io_counters()

        # Calculate speed (bytes per second)
        bytes_sent_per_sec = (network_io_current.bytes_sent - self.network_io_last.bytes_sent) / time_delta if time_delta > 0 else 0
        bytes_recv_per_sec = (network_io_current.bytes_recv - self.network_io_last.bytes_recv) / time_delta if time_delta > 0 else 0

        # Update last values
        self.network_io_last = network_io_current
        self.last_check_time = current_time

        # Get network interfaces
        interfaces = psutil.net_if_addrs()
        interface_stats = psutil.net_if_stats()

        interface_info = []
        for interface_name, addresses in interfaces.items():
            if interface_name in interface_stats:
                stats = interface_stats[interface_name]
                interface_info.append({
                    'name': interface_name,
                    'is_up': stats.isup,
                    'speed': stats.speed,
                    'addresses': [{'address': addr.address, 'family': str(addr.family)} for addr in addresses]
                })

        return {
            'total': {
                'bytes_sent': network_io_current.bytes_sent,
                'bytes_recv': network_io_current.bytes_recv,
                'packets_sent': network_io_current.packets_sent,
                'packets_recv': network_io_current.packets_recv,
                'mb_sent': round(network_io_current.bytes_sent / (1024**2), 2),
                'mb_recv': round(network_io_current.bytes_recv / (1024**2), 2)
            },
            'speed': {
                'upload_mbps': round(bytes_sent_per_sec * 8 / (1024**2), 2),  # Convert to Mbps
                'download_mbps': round(bytes_recv_per_sec * 8 / (1024**2), 2),
                'upload_kbps': round(bytes_sent_per_sec / 1024, 2),
                'download_kbps': round(bytes_recv_per_sec / 1024, 2)
            },
            'interfaces': interface_info
        }

    def get_temperature_info(self) -> Dict:
        """Get temperature information (CPU/GPU)"""
        temp_info = {
            'cpu': [],
            'gpu': []
        }

        # CPU Temperature
        try:
            temps = psutil.sensors_temperatures()
            if temps:
                for name, entries in temps.items():
                    for entry in entries:
                        temp_info['cpu'].append({
                            'label': f"{name} - {entry.label}" if entry.label else name,
                            'current': entry.current,
                            'high': entry.high if entry.high else None,
                            'critical': entry.critical if entry.critical else None
                        })
        except AttributeError:
            temp_info['cpu'] = [{'label': 'Not available on this system', 'current': 0}]

        # GPU Temperature
        if GPU_AVAILABLE:
            try:
                gpus = GPUtil.getGPUs()
                for i, gpu in enumerate(gpus):
                    temp_info['gpu'].append({
                        'id': i,
                        'name': gpu.name,
                        'temperature': gpu.temperature,
                        'load': gpu.load * 100,
                        'memory_used': gpu.memoryUsed,
                        'memory_total': gpu.memoryTotal,
                        'memory_percent': round((gpu.memoryUsed / gpu.memoryTotal * 100), 2) if gpu.memoryTotal > 0 else 0
                    })
            except:
                pass

        if not temp_info['gpu']:
            temp_info['gpu'] = [{'name': 'Not available', 'temperature': 0}]

        return temp_info

    def get_all_info(self) -> Dict:
        """Get all system information"""
        timestamp = datetime.now().isoformat()

        data = {
            'timestamp': timestamp,
            'cpu': self.get_cpu_info(),
            'memory': self.get_memory_info(),
            'disk': self.get_disk_info(),
            'network': self.get_network_info(),
            'temperature': self.get_temperature_info()
        }

        # Add to history
        self.data_history.append(data)

        return data

    def get_history(self) -> List[Dict]:
        """Get all collected data history"""
        return self.data_history

    def clear_history(self):
        """Clear data history"""
        self.data_history = []
