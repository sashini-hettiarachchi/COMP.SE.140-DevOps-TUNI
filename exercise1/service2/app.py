from flask import Flask, jsonify
import os
import logging
import subprocess
import psutil
import time

app = Flask(__name__)

# Set up logging configuration
logging.basicConfig(
    filename='service2.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
)


def get_system_info():
    # Get IP address
    try:
        ip_address = subprocess.check_output(['hostname', '-I']).decode().strip()
        logging.info(f"IP Address: {ip_address}")
    except Exception as e:
        logging.error(f"Error getting IP address: {e}")
        ip_address = "N/A"

    # Get disk space
    try:
        disk_space = subprocess.check_output(['df', '-h', '/']).decode()
        logging.info(f"Disk Usage:\n{disk_space}")
    except Exception as e:
        logging.error(f"Error getting disk space: {e}")
        disk_space = "N/A"

    # Get running processes
    try:
        processes = [{"pid": proc.pid, "name": proc.name()} for proc in psutil.process_iter()]
        logging.info(f"Running Processes:\n{processes}")
    except Exception as e:
        logging.error(f"Error getting processes: {e}")
        processes = "N/A"

    # Get uptime
    try:
        uptime_seconds = time.time() - psutil.boot_time()
        logging.info(f"Uptime (seconds since last boot): {uptime_seconds}")
    except Exception as e:
        logging.error(f"Error getting uptime: {e}")
        uptime_seconds = "N/A"

    return {
        "ip_address": ip_address,
        "processes": processes,
        "disk_space": disk_space,
        "uptime": uptime_seconds
    }


# Route to get system information
@app.route('/info', methods=['GET'])
def get_info():
    return jsonify(get_system_info())


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)