from flask import Flask, jsonify
import os
import logging


app = Flask(__name__)

# Set up logging configuration
logging.basicConfig(
    filename='service2.log',  # Log file name
    level=logging.INFO,       # Log level: INFO for general logging
    format='%(asctime)s - %(levelname)s - %(message)s',  # Log format
)


# Function to get system information
def get_system_info():
    # Get IP address
    ip_address = os.popen('hostname -I').read().strip()
    logging.info(f"IP Address: {ip_address}")

    # Get list of running processes
    processes = os.popen('ps -ax').read()
    logging.info(f"Running Processes: {processes}")

    # Get available disk space
    disk_space = os.popen('df -h /').read()
    logging.info(f"Disk Usage: {disk_space}") 

    # Get time since last boot
    uptime = os.popen('uptime').read().strip()
    logging.info(f"Uptime (seconds since last boot): {uptime}")

    return {
        "ip_address": ip_address,
        "processes": processes,
        "disk_space": disk_space,
        "uptime": uptime
    }

# Route to get system information
@app.route('/info', methods=['GET'])
def get_info():
    return jsonify(get_system_info())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
