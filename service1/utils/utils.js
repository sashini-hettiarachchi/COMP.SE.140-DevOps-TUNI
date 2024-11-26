import os from "os";
import { exec } from "child_process";

export const stateLog = [];
// Helper function to log state changes
export const logStateChange = (oldState, newState) => {
    const timestamp = new Date().toISOString();
    stateLog.push(`${timestamp}: ${oldState}->${newState}`);
}



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
      .find((iface) => iface.family === "IPv4" && !iface.internal)?.address || "N/A";

  // Get running processes
  exec("ps -ax", (err, stdout) => {
    const processes = err ? [] : parseProcesses(stdout);

    // Get available disk space
    exec("df -h /", (err, stdout) => {
      const diskSpace = err ? "Error fetching disk space" : stdout.trim();

      // Get uptime
      exec("uptime -s", (err, stdout) => {
        const startTime = err ? null : new Date(stdout.trim());
        const uptimeSeconds = startTime ? (Date.now() - startTime.getTime()) / 1000 : "N/A";

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
