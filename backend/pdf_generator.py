"""
PDF Report Generator
Creates PDF reports with graphs and tables from monitoring data
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from io import BytesIO
import os


class PDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2C3E50'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#34495E'),
            spaceAfter=12,
            spaceBefore=12
        )

    def create_chart(self, data_history, metric_name, ylabel, title, color='blue'):
        """Create a line chart for a specific metric"""
        if not data_history:
            return None

        fig, ax = plt.subplots(figsize=(10, 4))

        timestamps = []
        values = []

        for entry in data_history:
            try:
                timestamp = datetime.fromisoformat(entry['timestamp'])
                timestamps.append(timestamp)

                # Extract value based on metric_name
                if metric_name == 'cpu_percent':
                    values.append(entry['cpu']['percent'])
                elif metric_name == 'memory_percent':
                    values.append(entry['memory']['virtual']['percent'])
                elif metric_name == 'disk_percent':
                    if entry['disk']['partitions']:
                        values.append(entry['disk']['partitions'][0]['percent'])
                    else:
                        values.append(0)
                elif metric_name == 'network_upload':
                    values.append(entry['network']['speed']['upload_kbps'])
                elif metric_name == 'network_download':
                    values.append(entry['network']['speed']['download_kbps'])
                elif metric_name == 'cpu_temp':
                    if entry['temperature']['cpu']:
                        values.append(entry['temperature']['cpu'][0]['current'])
                    else:
                        values.append(0)
                elif metric_name == 'gpu_temp':
                    if entry['temperature']['gpu'] and entry['temperature']['gpu'][0].get('temperature'):
                        values.append(entry['temperature']['gpu'][0]['temperature'])
                    else:
                        values.append(0)
            except (KeyError, IndexError, TypeError):
                continue

        if timestamps and values:
            ax.plot(timestamps, values, color=color, linewidth=2, marker='o', markersize=4)
            ax.set_xlabel('Time', fontsize=10)
            ax.set_ylabel(ylabel, fontsize=10)
            ax.set_title(title, fontsize=12, fontweight='bold')
            ax.grid(True, alpha=0.3)

            # Format x-axis
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M:%S'))
            plt.xticks(rotation=45)
            plt.tight_layout()

            # Save to BytesIO
            img_buffer = BytesIO()
            plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
            img_buffer.seek(0)
            plt.close()

            return img_buffer

        plt.close()
        return None

    def create_summary_table(self, data_history):
        """Create summary statistics table"""
        if not data_history:
            return None

        latest = data_history[-1]

        data = [
            ['Metric', 'Current Value', 'Details'],
            ['CPU Usage', f"{latest['cpu']['percent']:.1f}%",
             f"{latest['cpu']['core_count']} cores, {latest['cpu']['thread_count']} threads"],
            ['Memory Usage', f"{latest['memory']['virtual']['percent']:.1f}%",
             f"{latest['memory']['virtual']['used_gb']:.2f} GB / {latest['memory']['virtual']['total_gb']:.2f} GB"],
            ['Disk Usage',
             f"{latest['disk']['partitions'][0]['percent']:.1f}%" if latest['disk']['partitions'] else 'N/A',
             f"{latest['disk']['partitions'][0]['used_gb']:.2f} GB / {latest['disk']['partitions'][0]['total_gb']:.2f} GB" if latest['disk']['partitions'] else 'N/A'],
            ['Network Upload', f"{latest['network']['speed']['upload_kbps']:.2f} KB/s",
             f"Total: {latest['network']['total']['mb_sent']:.2f} MB"],
            ['Network Download', f"{latest['network']['speed']['download_kbps']:.2f} KB/s",
             f"Total: {latest['network']['total']['mb_recv']:.2f} MB"],
        ]

        # Add temperature if available
        if latest['temperature']['cpu'] and latest['temperature']['cpu'][0]['current'] > 0:
            data.append(['CPU Temperature',
                        f"{latest['temperature']['cpu'][0]['current']:.1f}°C",
                        latest['temperature']['cpu'][0]['label']])

        if latest['temperature']['gpu'] and latest['temperature']['gpu'][0].get('temperature', 0) > 0:
            data.append(['GPU Temperature',
                        f"{latest['temperature']['gpu'][0]['temperature']:.1f}°C",
                        latest['temperature']['gpu'][0]['name']])

        table = Table(data, colWidths=[2*inch, 1.5*inch, 3*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498DB')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))

        return table

    def create_statistics_table(self, data_history):
        """Create statistics table with min, max, avg values"""
        if not data_history:
            return None

        # Calculate statistics
        cpu_values = [d['cpu']['percent'] for d in data_history]
        mem_values = [d['memory']['virtual']['percent'] for d in data_history]

        data = [
            ['Metric', 'Minimum', 'Maximum', 'Average'],
            ['CPU Usage (%)', f"{min(cpu_values):.1f}", f"{max(cpu_values):.1f}", f"{sum(cpu_values)/len(cpu_values):.1f}"],
            ['Memory Usage (%)', f"{min(mem_values):.1f}", f"{max(mem_values):.1f}", f"{sum(mem_values)/len(mem_values):.1f}"],
        ]

        # Network stats
        upload_values = [d['network']['speed']['upload_kbps'] for d in data_history]
        download_values = [d['network']['speed']['download_kbps'] for d in data_history]

        data.append(['Upload Speed (KB/s)', f"{min(upload_values):.2f}", f"{max(upload_values):.2f}", f"{sum(upload_values)/len(upload_values):.2f}"])
        data.append(['Download Speed (KB/s)', f"{min(download_values):.2f}", f"{max(download_values):.2f}", f"{sum(download_values)/len(download_values):.2f}"])

        table = Table(data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2ECC71')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))

        return table

    def generate_report(self, data_history, output_path='system_report.pdf'):
        """Generate complete PDF report"""
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        story = []

        # Title
        title = Paragraph("System Resource Monitoring Report", self.title_style)
        story.append(title)

        # Report info
        if data_history:
            start_time = datetime.fromisoformat(data_history[0]['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
            end_time = datetime.fromisoformat(data_history[-1]['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
            duration = len(data_history) * 10  # 10 seconds interval

            info_text = f"<b>Report Period:</b> {start_time} to {end_time}<br/>"
            info_text += f"<b>Duration:</b> {duration} seconds ({len(data_history)} samples)<br/>"
            info_text += f"<b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

            info = Paragraph(info_text, self.styles['Normal'])
            story.append(info)
            story.append(Spacer(1, 0.3*inch))

        # Current Status Summary
        story.append(Paragraph("Current System Status", self.heading_style))
        summary_table = self.create_summary_table(data_history)
        if summary_table:
            story.append(summary_table)
            story.append(Spacer(1, 0.3*inch))

        # Statistics Summary
        story.append(Paragraph("Statistics Summary", self.heading_style))
        stats_table = self.create_statistics_table(data_history)
        if stats_table:
            story.append(stats_table)
            story.append(Spacer(1, 0.3*inch))

        # CPU Chart
        story.append(PageBreak())
        story.append(Paragraph("CPU Usage Over Time", self.heading_style))
        cpu_chart = self.create_chart(data_history, 'cpu_percent', 'CPU Usage (%)',
                                      'CPU Usage', color='#E74C3C')
        if cpu_chart:
            story.append(Image(cpu_chart, width=6.5*inch, height=2.6*inch))
            story.append(Spacer(1, 0.2*inch))

        # Memory Chart
        story.append(Paragraph("Memory Usage Over Time", self.heading_style))
        mem_chart = self.create_chart(data_history, 'memory_percent', 'Memory Usage (%)',
                                      'Memory Usage', color='#3498DB')
        if mem_chart:
            story.append(Image(mem_chart, width=6.5*inch, height=2.6*inch))
            story.append(Spacer(1, 0.2*inch))

        # Network Charts
        story.append(PageBreak())
        story.append(Paragraph("Network Upload Speed Over Time", self.heading_style))
        upload_chart = self.create_chart(data_history, 'network_upload', 'Upload Speed (KB/s)',
                                         'Network Upload', color='#2ECC71')
        if upload_chart:
            story.append(Image(upload_chart, width=6.5*inch, height=2.6*inch))
            story.append(Spacer(1, 0.2*inch))

        story.append(Paragraph("Network Download Speed Over Time", self.heading_style))
        download_chart = self.create_chart(data_history, 'network_download', 'Download Speed (KB/s)',
                                           'Network Download', color='#9B59B6')
        if download_chart:
            story.append(Image(download_chart, width=6.5*inch, height=2.6*inch))
            story.append(Spacer(1, 0.2*inch))

        # Temperature Charts
        story.append(PageBreak())
        story.append(Paragraph("Temperature Monitoring", self.heading_style))

        cpu_temp_chart = self.create_chart(data_history, 'cpu_temp', 'Temperature (°C)',
                                           'CPU Temperature', color='#F39C12')
        if cpu_temp_chart:
            story.append(Image(cpu_temp_chart, width=6.5*inch, height=2.6*inch))
            story.append(Spacer(1, 0.2*inch))

        gpu_temp_chart = self.create_chart(data_history, 'gpu_temp', 'Temperature (°C)',
                                           'GPU Temperature', color='#E67E22')
        if gpu_temp_chart:
            story.append(Image(gpu_temp_chart, width=6.5*inch, height=2.6*inch))

        # Build PDF
        doc.build(story)

        return output_path
