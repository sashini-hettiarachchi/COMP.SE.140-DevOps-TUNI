const express = require('express');
const os = require('os');
const exec = require('child_process').exec;
const axios = require('axios');

const app = express();
const SERVICE2_URL = 'http://service2:5000/info';

// Function to get system information
function getSystemInfo(callback) {
    // Get IP address
    let ipAddress = Object.values(os.networkInterfaces())
        .flat()
        .find(iface => iface.family === 'IPv4' && !iface.internal)?.address || 'N/A';

    // Get running processes
    exec('ps -ax', (err, stdout) => {
        const processes = stdout || 'Error fetching processes';

        // Get available disk space
        exec('df -h /', (err, stdout) => {
            const diskSpace = stdout || 'Error fetching disk space';
            // Get uptime
            exec('uptime', (err, stdout) => {
                const uptime = stdout.trim() || 'Error fetching uptime';

                callback({
                    ip_address: ipAddress,
                    processes: processes,
                    disk_space: diskSpace,
                    uptime: uptime
                });
            });
        });
    });
}

// Route to get info for both Service1 and Service2
app.get('/', async (req, res) => {
    getSystemInfo(async (service1Info) => {
        // Fetch information from Service2
        try {
            const service2Response = await axios.get(SERVICE2_URL);
            const service2Info = service2Response.data;
            res.json({
                "Service1": service1Info,
                "Service2": service2Info
            });
        } catch (error) {
            res.json({
                "Service1": service1Info,
                "Service2": { "error": "Could not retrieve Service2 information" }
            });
        }
    });
});

// Start server on port 8199
app.listen(8199, () => {
    console.log('Service1 running on port 8199');
});
