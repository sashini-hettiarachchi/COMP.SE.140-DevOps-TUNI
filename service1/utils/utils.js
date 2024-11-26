export const stateLog = [];
// Helper function to log state changes
export const logStateChange = (oldState, newState) => {
    const timestamp = new Date().toISOString();
    stateLog.push(`${timestamp}: ${oldState}->${newState}`);
}