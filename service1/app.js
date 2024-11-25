import express from "express";
import os from "os";
import { exec } from "child_process";
import axios from "axios";
import { STATES } from "./utils/constants.js";
import { updateState } from "./controller/stateController.js";

const app = express();
const SERVICE2_URL = "http://service2:5000/info";

// Function to get system information
function getSystemInfo(callback) {
  // Get IP address
  let ipAddress =
    Object.values(os.networkInterfaces())
      .flat()
      .find((iface) => iface.family === "IPv4" && !iface.internal)?.address ||
    "N/A";

  // Get running processes
  exec("ps -ax", (err, stdout) => {
    const processes = stdout || "Error fetching processes";

    // Get available disk space
    exec("df -h /", (err, stdout) => {
      const diskSpace = stdout || "Error fetching disk space";
      // Get uptime
      exec("uptime", (err, stdout) => {
        const uptime = stdout.trim() || "Error fetching uptime";

        callback({
          ip_address: ipAddress,
          processes: processes,
          disk_space: diskSpace,
          uptime: uptime,
        });
      });
    });
  });
}

// Route to get info for both Service1 and Service2
app.get("/", async (req, res) => {
  getSystemInfo(async (service1Info) => {
    // Fetch information from Service2
    try {
      const service2Response = await axios.get(SERVICE2_URL);
      const service2Info = service2Response.data;

      res.json({
        Service1: service1Info,
        Service2: service2Info,
      });
    } catch (error) {
      res.json({
        Service1: service1Info,
        Service2: { error: "Could not retrieve Service2 information" },
      });
    }

    // Delay response by 2 seconds before handling the next request
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });
});

// Route to get info for both Service1 and Service2
app.get("/request", async (req, res) => {
  getSystemInfo(async (service1Info) => {
    // Fetch information from Service2
    try {
      const service2Response = await axios.get(SERVICE2_URL);
      const service2Info = service2Response.data;

      // Respond with combined information
      res.json({
        Service1: service1Info,
        Service2: service2Info,
      });
    } catch (error) {
      res.json({
        Service1: service1Info,
        Service2: { error: "Could not retrieve Service2 information" },
      });
    }

    // Delay response by 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });
});

app.post("/stop", (req, res) => {
  res.send("Shutting down all services...");
  console.log("Received stop request, shutting down Docker containers.");

  // Execute Docker command to shut down all containers
  exec("docker compose down", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error shutting down: ${error.message}`);
      return;
    }
    console.log("Docker containers stopped.");
  });
});

app.put("/state", (req, res) => {
  const { state: newState } = req.body;

  try {
    // Update the state using the controller function
    const result = updateState(newState);
    return res.status(200).json(result); // Send the result as JSON
  } catch (error) {
    if (error.message === "Invalid transition") {
      return res.status(400).json({ error: "Invalid transition" });
    }
    return res.status(500).json({ error: error.message });
  }
});
// Start server on port 8199
app.listen(8199, () => {
  console.log("Service1 running on port 8199");
});
