import { STATES } from "../utils/constants.js";
import {
  logStateChangeToDB,
  getCurrentStateFromDB,
  getStateLogsFromDB,
} from "../utils/mongo.js"; // Use the MongoDB utility functions

// Store the current state (still in-memory for simplicity, can also be stored in DB)
let currentState = (await getCurrentStateFromDB()) || "INIT";

// Function to handle state updates
export const updateState = async (newState) => {
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
  await logStateChangeToDB(currentState, newState);

  // Handle state transitions based on the current state
  switch (currentState) {
    // case "":
    //   if (newState === STATES.INIT) {
    //     currentState = STATES.INIT;
    //     const result = await startDockerContainers();
    //     if (result) {
    //       currentState = STATES.RUNNING;
    //     }
    //     return `State updated to INIT. Current state is : ${currentState}`;
    //   }

    // case STATES.INIT:
    //   if (newState === STATES.RUNNING) {
    //     currentState = STATES.RUNNING;
    //     return `State updated to RUNNING. Current state is : ${currentState}`;
    //   } else {
    //     return "Invalid transition from INIT state";
    //   }

    case STATES.RUNNING:
      if (newState === STATES.PAUSED || newState === STATES.SHUTDOWN) {
        currentState = newState;
        if (newState === STATES.SHUTDOWN) {
          stopDockerContainers();
        }
        return `State updated to ${newState}. Current state is : ${currentState}`;
      } else {
        return "Invalid transition from RUNNING state";
      }

    case STATES.PAUSED:
      if (newState === STATES.RUNNING) {
        currentState = STATES.RUNNING;
        return `State updated to RUNNING. Current state is : ${currentState}`;
      } else {
        return "Invalid transition from PAUSED state";
      }

    case STATES.SHUTDOWN:
      if (newState === STATES.INIT) {
        currentState = STATES.INIT;
        return `State updated to INIT. Current state is : ${currentState}`;
      } else {
        return "Invalid transition from SHUTDOWN state";
      }

    default:
      return "Unknown error occurred";
  }
};

export const getStateLog = async () => {
  const logs = await getStateLogsFromDB();
  return logs
    .map((log) => `${log.timestamp}: ${log.oldState} -> ${log.newState}`)
    .join("\n");
};

export const getCurrentState = async () => await getCurrentStateFromDB();