import os from "os";
import { exec } from "child_process";
import { getCurrentState, saveStateChange, setCurrentState } from "./mongo.js";
import { STATES } from "./constants.js";
import { stopSystem } from "./dockerUtil.js";

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

export const updateState = async (newState) => {
  const currentState = await getCurrentState();
  // Validate the input state
  const validStates = [
    STATES.INIT,
    STATES.PAUSED,
    STATES.RUNNING,
    STATES.SHUTDOWN,
  ];

  if (!validStates.includes(newState)) {
    return "Invalid transition";
  }

  // Handle special case: if the new state is the same as the current state
  if (newState === currentState) {
    return `No state change required. Current state is : ${currentState}`;
  }

  // Log state change to MongoDB
  await saveStateChange(currentState, newState);
  await setCurrentState(newState);

  // Handle state transitions based on the current state
  switch (newState) {
    case STATES.INIT:
      return `Updated state to ${newState} from ${currentState}`;

    case STATES.PAUSED:
      return `Updated state to ${newState} from ${currentState}`;

    case STATES.RUNNING:
      return `Updated state to ${newState} from ${currentState}`;

    case STATES.SHUTDOWN:
      stopSystem();
      return `Updated state to ${newState} from ${currentState}`;

    default:
      return `Error: Invalid state transition from ${currentState} to ${newState}`;
  }
};