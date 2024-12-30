import os, { release } from "os";
import { exec } from "child_process";
import { acquireLock, getCurrentState, saveStateChange } from "./mongo.js";
import { STATES } from "./constants.js";

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

// const DOCKER_COMPOSE_FILE = "./docker-compose.yml";

// export const startDockerContainers = async () => {
//   return new Promise((resolve, reject) => {
//     exec(
//       `docker compose -f ${DOCKER_COMPOSE_FILE} up -d`,
//       async (error, stdout, stderr) => {
//         if (error) {
//           console.error("Error initializing Docker containers:", error.message);
//           reject(false); // Reject promise if there is an error
//           return;
//         }

//         if (stderr) {
//           console.warn(
//             "Warnings while initializing Docker containers:",
//             stderr
//           );
//         }

//         console.log("Docker containers initialized successfully.");

//         // Set the state to INIT in the DB after containers are up
//         try {
//           await setCurrentStateInDB("INIT"); // Set state to INIT in MongoDB
//           resolve(true); // Resolve promise if everything goes well
//         } catch (err) {
//           console.error("Error setting state to INIT in MongoDB:", err);
//           reject(false); // Reject promise if MongoDB update fails
//         }
//       }
//     );
//   });
// };

// export const stopDockerContainers = () => {
//   exec(
//     `docker compose -f ${DOCKER_COMPOSE_FILE} down`,
//     (error, stdout, stderr) => {
//       if (error) {
//         console.error(`Error shutting down containers: ${error.message}`);
//         return false;
//       }
//       console.log("Docker containers stopped.");
//       return true;
//     }
//   );
// };

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
  // await saveStateChange(currentState, newState);
  // await updateState(newState);

  // Handle state transitions based on the current state
  switch (newState) {
    case STATES.INIT:
      reInitialize();
      return `Updated state to ${newState} from ${currentState}`;

    case STATES.PAUSED:
      pausedSystem();
      return `Updated state to ${newState} from ${currentState}`;

    case STATES.RUNNING:
      runningSystem();
      return `Updated state to ${newState} from ${currentState}`;

    case STATES.SHUTDOWN:
      stopSystem();
      return `Updated state to ${newState} from ${currentState}`;

    default:
      return `Error: Invalid state transition from ${currentState} to ${newState}`;
  }
};

const executeCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${stderr}`);
        reject(error);
      } else {
        console.log(stdout);
        resolve(stdout);
      }
    });
  });
};

// Reinitialize the system: Stops and removes containers, then starts them fresh
const reInitialize = async () => {
  console.log("Reinitializing system...");
  try {
    await executeCommand("docker compose down");
    await executeCommand("docker compose up -d");
    console.log("System reinitialized.");
  } catch (error) {
    console.error("Failed to reinitialize system:", error.message);
  }
};

// Pause all containers
const pausedSystem = async () => {
  console.log("Pausing system...");
  try {
    await executeCommand("docker compose pause");
    console.log("System paused.");
  } catch (error) {
    console.error("Failed to pause system:", error.message);
  }
};

// Resume running all containers
const runningSystem = async () => {
  console.log("Resuming system...");
  try {
    await executeCommand("docker compose unpause");
    console.log("System running.");
  } catch (error) {
    console.error("Failed to resume system:", error.message);
  }
};

// Stop all containers
const stopSystem = async () => {
  console.log("Stopping system...");
  try {
    await executeCommand("docker compose stop");
    console.log("System stopped.");
  } catch (error) {
    console.error("Failed to stop system:", error.message);
  }
};

