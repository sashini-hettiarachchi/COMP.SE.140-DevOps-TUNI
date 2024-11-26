import express from "express";
import { exec } from "child_process";
import axios from "axios";
import {
  updateState,
  getCurrentState,
  getStateLog,
} from "./controller/stateController.js";
import { getSystemInfo } from "./utils/utils.js";

const app = express();
app.use(express.json());
const SERVICE2_URL = "http://service2:5000/info";

app.get("/request", async (req, res) => {
  getSystemInfo(async (service1Info) => {
    let service2Info;

    try {
      const service2Response = await axios.get(SERVICE2_URL);
      const data = service2Response.data;

      // Normalize Service2 data to match the format
      service2Info = {
        ip_address: data.ip_address || "N/A",
        processes: data.processes || [],
        disk_space: data.disk_space || "N/A",
        uptime: data.uptime || "N/A",
      };
    } catch (error) {
      service2Info = {
        ip_address: "N/A",
        processes: [],
        disk_space: "Error fetching Service2 disk space",
        uptime: "Error fetching Service2 uptime",
      };
    }

    // Respond in plain text format
    const responseText = `
Service1 Info:
IP Address: ${service1Info.ip_address}
Processes: ${JSON.stringify(service1Info.processes, null, 2)}
Disk Space: ${service1Info.disk_space}
Uptime (seconds): ${service1Info.uptime}

Service2 Info:
IP Address: ${service2Info.ip_address}
Processes: ${JSON.stringify(service2Info.processes, null, 2)}
Disk Space: ${service2Info.disk_space}
Uptime (seconds): ${service2Info.uptime}
    `.trim();

    // Add 2-second artificial delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

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
