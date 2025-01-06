import os from "os";
import { exec } from "child_process";
import { getCurrentState, saveStateChange, setCurrentState } from "../utils/mongo.js";
import { STATES } from "../utils/constants.js";
import { stopSystem } from "../utils/dockerUtil.js";
import { getSystemInfo, updateState } from "../utils/utils.js";

jest.mock("os");
jest.mock("child_process");
jest.mock("../utils/mongo.js");
jest.mock("../utils/dockerUtil.js");

describe("Utils Tests", () => {
  describe("getSystemInfo", () => {
    // it("should return system information", (done) => {
    //   os.networkInterfaces.mockReturnValue({
    //     eth0: [{ family: "IPv4", address: "192.168.1.1", internal: false }],
    //   });

    //   exec.mockImplementation((cmd, callback) => {
    //     if (cmd === "ps -ax") {
    //       callback(null, "  PID TTY           TIME CMD\n  123 ?        00:00:00 bash\n");
    //     } else if (cmd === "df -h /") {
    //       callback(null, "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   20G   30G  40% /");
    //     } else if (cmd === "uptime -s") {
    //       callback(null, "2023-01-01 00:00:00");
    //     }
    //   });

    //   getSystemInfo((info) => {
    //     expect(info).toEqual({
    //       ip_address: "192.168.1.1",
    //       processes: [{ pid: "123", name: "bash" }],
    //       disk_space: "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   20G   30G  40% /",
    //       uptime: expect.any(Number),
    //     });
    //     done();
    //   });
    // });

    it("should handle errors gracefully", (done) => {
      os.networkInterfaces.mockReturnValue({});
      exec.mockImplementation((cmd, callback) => {
        callback(new Error("error"), "");
      });

      getSystemInfo((info) => {
        expect(info).toEqual({
          ip_address: "N/A",
          processes: [],
          disk_space: "Error fetching disk space",
          uptime: "N/A",
        });
        done();
      });
    });
  });

  describe("updateState", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should update state successfully", async () => {
      getCurrentState.mockResolvedValue(STATES.INIT);
      saveStateChange.mockResolvedValue();
      setCurrentState.mockResolvedValue();

      const result = await updateState(STATES.RUNNING);

      expect(result).toBe(`Updated state to ${STATES.RUNNING} from ${STATES.INIT}`);
      expect(saveStateChange).toHaveBeenCalledWith(STATES.INIT, STATES.RUNNING);
      expect(setCurrentState).toHaveBeenCalledWith(STATES.RUNNING);
    });

    it("should return invalid transition for invalid state", async () => {
      const result = await updateState("INVALID_STATE");

      expect(result).toBe("Invalid transition");
    });

    it("should return no state change required for same state", async () => {
      getCurrentState.mockResolvedValue(STATES.RUNNING);

      const result = await updateState(STATES.RUNNING);

      expect(result).toBe(`No state change required. Current state is : ${STATES.RUNNING}`);
    });

    it("should handle shutdown state", async () => {
      getCurrentState.mockResolvedValue(STATES.RUNNING);
      saveStateChange.mockResolvedValue();
      setCurrentState.mockResolvedValue();

      const result = await updateState(STATES.SHUTDOWN);

      expect(result).toBe(`Updated state to ${STATES.SHUTDOWN} from ${STATES.RUNNING}`);
      expect(stopSystem).toHaveBeenCalled();
    });
  });
});