import express from "express";
import axios from "axios";
import {
  updateState,
  getCurrentState,
  getStateLog,
} from "./controller/stateController.js";
import { getSystemInfo, startDockerContainers } from "./utils/utils.js";
import { setCurrentStateInDB, logStateChangeToDB , connectToDB} from "./utils/mongo.js";

const app = express();
app.use(express.text());

const SERVICE2_URL = "http://service2:5000/info";

app.get("/request", async (req, res) => {
  const currentState = await getCurrentState();
  if (currentState !== "RUNNING") {
    return res
      .status(503)
      .send("System is not in RUNNING state. Please try again later.");
  }

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

app.get("/", async (req, res) => {
  const currentState = await getCurrentState();
  if (currentState !== "RUNNING") {
    return res
      .status(503)
      .send("System is not in RUNNING state. Please try again later.");
  }

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
  const currentState = await getCurrentState();
  if (currentState === "SHUTDOWN") {
    return res.status(400).send("System is already in SHUTDOWN state.");
  }
  startDockerContainers();
  res.status(200).send("Shutting down all services...");
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
      const result = updateState(newState);
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
    const log = await getStateLog(); // Get logs from MongoDB
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

// Initialize state and start containers
const initializeState = async () => {
  try {
    // Start the Docker containers and set state to INIT in DB
    const containersStarted = await startDockerContainers();

    if (containersStarted) {
      await setCurrentStateInDB("RUNNING"); // Set state to RUNNING in MongoDB
      await logStateChangeToDB("INIT", "RUNNING"); // Log state change
      console.log("State initialized to INIT after containers started.");
    } else {
      console.error("Failed to start Docker containers.");
    }
  } catch (error) {
    console.error("Error during initialization:", error);
  }
};

// // Call initializeState during app startup to ensure containers are up and state is set
// initializeState();

// Assuming connectToDB is an async function that establishes the DB connection
async function startServer() {
  try {
    // Wait for DB connection
    await connectToDB();
    // Start the server after a successful DB connection
    app.listen(8199, () => {
      console.log('Server is running on port 8199');
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    // Retry after 5 seconds if DB connection fails
    setTimeout(startServer, 5000);
  }
}

// Call startServer to initiate the connection and server start
startServer();

