import os from "os";
import { exec } from "child_process";
import { logStateChangeToDB, setCurrentStateInDB } from "./mongo.js";

export const stateLog = [];
// Helper function to log state changes
export const logStateChange = (oldState, newState) => {
  const timestamp = new Date().toISOString();
  stateLog.push(`${timestamp}: ${oldState}->${newState}`);
};

// Function to parse processes from the `ps -ax` command to a structured format
const parseProcesses = (processOutput) => {
  const lines = processOutput.split("\n").slice(1); // Skip the header line
  return lines
    .filter((line) => line.trim()) // Remove empty lines
    .map((line) => {
      const parts = line.trim().split(/\s+/); // Split by whitespace
      const pid = parts[0];
      const command = parts.slice(4).join(" "); // Command starts at the 5th column
      return { pid, name: command };
    });
};

// Function to get system information for Service1
export const getSystemInfo = (callback) => {
  // Get IP address
  const ipAddress =
    Object.values(os.networkInterfaces())
      .flat()
      .find((iface) => iface.family === "IPv4" && !iface.internal)?.address ||
    "N/A";

  // Get running processes
  exec("ps -ax", (err, stdout) => {
    const processes = err ? [] : parseProcesses(stdout);

    // Get available disk space
    exec("df -h /", (err, stdout) => {
      const diskSpace = err ? "Error fetching disk space" : stdout.trim();

      // Get uptime
      exec("uptime -s", (err, stdout) => {
        const startTime = err ? null : new Date(stdout.trim());
        const uptimeSeconds = startTime
          ? (Date.now() - startTime.getTime()) / 1000
          : "N/A";

        callback({
          ip_address: ipAddress,
          processes: processes,
          disk_space: diskSpace,
          uptime: uptimeSeconds,
        });
      });
    });
  });
};

const DOCKER_COMPOSE_FILE = "../docker-compose.yml";

export const startDockerContainers = async () => {
  return new Promise((resolve, reject) => {
    exec(
      `docker compose -f ${DOCKER_COMPOSE_FILE} up -d`,
      async (error, stdout, stderr) => {
        if (error) {
          console.error("Error initializing Docker containers:", error.message);
          reject(false); // Reject promise if there is an error
          return;
        }

        if (stderr) {
          console.warn(
            "Warnings while initializing Docker containers:",
            stderr
          );
        }

        console.log("Docker containers initialized successfully.");

        // Set the state to INIT in the DB after containers are up
        try {
          await setCurrentStateInDB("INIT"); // Set state to INIT in MongoDB
          resolve(true); // Resolve promise if everything goes well
        } catch (err) {
          console.error("Error setting state to INIT in MongoDB:", err);
          reject(false); // Reject promise if MongoDB update fails
        }
      }
    );
  });
};

export const stopDockerContainers = () => {
  exec(
    `docker compose -f ${DOCKER_COMPOSE_FILE} down`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error shutting down containers: ${error.message}`);
        return false;
      }
      console.log("Docker containers stopped.");
      return true;
    }
  );
};
