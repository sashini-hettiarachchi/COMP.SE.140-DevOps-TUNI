from flask import Flask, jsonify
import os

app = Flask(__name__)

# Function to get system information
def get_system_info():
    # Get IP address
    ip_address = os.popen('hostname -I').read().strip()
    print(ip_address)

    # Get list of running processes
    processes = os.popen('ps -ax').read()
    print(processes)

    # Get available disk space
    disk_space = os.popen('df -h /').read()
    print(disk_space)

    # Get time since last boot
    uptime = os.popen('uptime').read().strip()
    print(uptime)

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
