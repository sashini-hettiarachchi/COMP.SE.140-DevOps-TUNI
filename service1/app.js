import express from "express";
import os from "os";
import { exec } from "child_process";
import axios from "axios";
import { STATES } from "./utils/constants.js";
import { logStateChange } from "./utils/utils.js";

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

// In-memory storage for current state and logs
let currentState = STATES.INIT; // Default state

// Route to handle state changes
app.put("/state", express.json(), (req, res) => {
  const { state: newState } = req.body;

  // Validate the input state
  const validStates = [
    STATES.INIT,
    STATES.PAUSED,
    STATES.RUNNING,
    STATES.SHUTDOWN,
  ];
  if (!validStates.includes(newState)) {
    return res.status(400).json({ error: "Invalid transition" });
  }

  // Handle special case: if the new state is the same as the current state
  if (newState === currentState) {
    return res
      .status(200)
      .json({ message: "No state change required.", state: currentState });
  }

  // Handle state transitions
  switch (newState) {
    case STATES.INIT:
      // Reset everything except log information
      currentState = STATES.INIT;
      logStateChange(STATES.INIT);
      return res
        .status(200)
        .json({ message: "State updated to INIT", state: currentState });

    case STATES.PAUSED:
      currentState = STATES.PAUSED;
      logStateChange(STATES.PAUSED);
      return res
        .status(200)
        .json({ message: "State updated to PAUSED.", state: currentState });

    case STATES.RUNNING:
      currentState = STATES.RUNNING;
      logStateChange(STATES.RUNNING);
      return res
        .status(200)
        .json({ message: "State updated to RUNNING", state: currentState });

    case STATES.SHUTDOWN:
      logStateChange(STATES.SHUTDOWN);
      currentState = STATES.SHUTDOWN;
      // Simulate shutting down containers
      exec("docker compose down", (error, stdout, stderr) => {
        if (error) {
          console.error(`Error shutting down containers: ${error.message}`);
        }
        console.log("Docker containers stopped.");
      });
      return res
        .status(200)
        .json({ message: "State updated to SHUTDOWN.", state: currentState });

    default:
      // Should never reach here due to validation
      return res.status(500).json({ error: "Unknown error occurred." });
  }
});

// Start server on port 8199
app.listen(8199, () => {
  console.log("Service1 running on port 8199");
});
