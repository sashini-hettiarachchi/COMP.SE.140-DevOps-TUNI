import { STATES } from '../utils/constants.js';  
import { exec } from 'child_process';
import { logStateChange } from '../utils/utils.js'; 

// Store the current state (you might want to manage this in a more persistent way)
let currentState = STATES.INIT;

export const setCurrentState = (state) => {
    currentState = state;
};

export const getCurrentState = () => {
    return currentState;
}
// Function to handle state updates
export const updateState = (newState) => {
    // Validate the input state
    const validStates = [
        STATES.INIT,
        STATES.PAUSED,
        STATES.RUNNING,
        STATES.SHUTDOWN,
    ];

    if (!validStates.includes(newState)) {
        throw new Error("Invalid transition");
    }

    // Handle special case: if the new state is the same as the current state
    if (newState === currentState) {
        return { message: "No state change required.", state: currentState };
    }

    // Handle state transitions
    switch (newState) {
        case STATES.INIT:
            currentState = STATES.INIT;
            logStateChange(STATES.INIT);
            return { message: "State updated to INIT", state: currentState };

        case STATES.PAUSED:
            currentState = STATES.PAUSED;
            logStateChange(STATES.PAUSED);
            return { message: "State updated to PAUSED", state: currentState };

        case STATES.RUNNING:
            currentState = STATES.RUNNING;
            logStateChange(STATES.RUNNING);
            return { message: "State updated to RUNNING", state: currentState };

        case STATES.SHUTDOWN:
            currentState = STATES.SHUTDOWN;
            logStateChange(STATES.SHUTDOWN);
            // Simulate shutting down containers
            exec("docker compose down", (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error shutting down containers: ${error.message}`);
                }
                console.log("Docker containers stopped.");
            });
            return { message: "State updated to SHUTDOWN", state: currentState };

        default:
            // Should never reach here due to validation
            throw new Error("Unknown error occurred");
    }
};