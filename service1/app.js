import express from "express";
import axios from "axios";
import { getSystemInfo, updateState } from "./utils/utils.js";
import { getCurrentState, getStateLogs } from "./utils/mongo.js";
import { initializeState } from "./utils/initializer.js";
import { STATES, SERVICE2_URL } from "./utils/constants.js";
import { stopSystem } from "./utils/dockerUtil.js";

export const app = express();
app.use(express.text(), express.json());

app.use(async (req, res, next) => {
  const currentState = await getCurrentState();

  if (
    currentState === STATES.PAUSED &&
    !(req.url === "/state" && req.method === "PUT")
  ) {
    return res
      .status(503)
      .send("System is in PAUSED state. Please try again later.");
  }

  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

app.get("/request", async (req, res) => {
  const currentState = await getCurrentState();
  if (currentState !== "RUNNING") {
    return res
      .status(503)
      .send("System is not in RUNNING state. Please try again later.");
  }

  console.log("Received request for system info.");

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

app.post("/stop", async (req, res) => {
  res.status(200).send("Shutting down all services...");
  stopSystem();
  console.log("Received stop request, shutting down Docker containers.");
});

app.all("/state", async (req, res) => {
  if (req.method === "GET") {
    const currentState = await getCurrentState();
    try {
      res
        .status(200)
        .type("text/plain")
        .send(`current state is ${currentState}`);
    } catch (error) {
      console.error("Error retrieving state:", error.message);
      res
        .status(500)
        .type("text/plain")
        .send("An error occurred while retrieving state.");
    }
  }
  if (req.method === "PUT") {
    const newState = req.body;

    if (!newState) {
      return res.status(400).type("text/plain").send("State must be provided.");
    }

    try {
      const result = await updateState(newState);
      return res.status(200).type("text/plain").send(result);
    } catch (error) {
      if (error.message === "Invalid transition") {
        return res.status(400).type("text/plain").send("Invalid transition.");
      }
      console.error("Error updating state:", error.message);
      return res.status(500).type("text/plain").send(error.message);
    }
  }

  res.status(405).type("text/plain").send("Method Not Allowed");
});

app.get("/run-log", async (req, res) => {
  try {
    const log = await getStateLogs();
    if (log.length === 0) {
      return res
        .status(200)
        .type("text/plain")
        .send("No state changes logged yet.");
    }
    res.status(200).type("text/plain").send(log);
  } catch (error) {
    console.error("Error retrieving state log:", error);
    res.status(500).send("An error occurred while retrieving the state log.");
  }
});

const startServer = async () => {
  try {
    await initializeState();
    app.listen(8199, () => console.log("Server is running on port 8199"));
  } catch (error) {
    console.error("Failed to start server:", error);
    setTimeout(startServer, 5000); // Retry on failure
  }
};

startServer();
