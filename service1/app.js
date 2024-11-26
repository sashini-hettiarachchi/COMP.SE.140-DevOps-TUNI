import express from "express";
import os from "os";
import { exec } from "child_process";
import axios from "axios";
import {
  updateState,
  getCurrentState,
  getStateLog,
} from "./controller/stateController.js";

const app = express();
app.use(express.json());
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

app.get("/request", async (req, res) => {
  getSystemInfo(async (service1Info) => {
    let service2Info;
    try {
      // Fetch information from Service2
      const service2Response = await axios.get(SERVICE2_URL);
      service2Info = service2Response.data;
    } catch (error) {
      service2Info = { error: "Could not retrieve Service2 information" };
    }

    // Format the combined information into plain text
    const responseText = `
Service1 Info:
${JSON.stringify(service1Info, null, 2)}

Service2 Info:
${JSON.stringify(service2Info, null, 2)}
    `.trim();

    // Delay the response by 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Respond with plain text
    res.status(200).type("text/plain").send(responseText);
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

app.get("/state", (req, res) => {
  try {
    const state = getCurrentState();
    res.status(200).type("text/plain").send(state);
  } catch (error) {
    res.status(500).send("An error occurred while retrieving state.");
  }
});

app.get("/run-log", (req, res) => {
  try {
    const log = getStateLog();
    res.status(200).type("text/plain").send(log.join("\n"));
  } catch (error) {
    res.status(500).send("An error occurred while retrieving the state log.");
  }
});

// Start server on port 8199
app.listen(8199, () => {
  console.log("Service1 running on port 8199");
});
