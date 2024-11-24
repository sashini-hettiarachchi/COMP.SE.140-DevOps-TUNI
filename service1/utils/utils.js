const stateLog = [];
// Helper function to log state changes
export const logStateChange = (newState) => {
    stateLog.push({
        timestamp: new Date().toISOString(),
        state: newState
    });
}