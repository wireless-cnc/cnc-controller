import { WEB_TO_DESKTOP_CNC_ACTIVE, WEB_TO_DESKTOP_CNC_INACTIVE } from "../api";
import { powerSaveBlocker, ipcMain } from "electron";
import logger from "../logger";

const log = logger.scope("PowerSaver");

const NO_SLEEP_FLAG = "nosleep";

export class PowerSaverController {
  private blockerId: number;

  constructor() {
    this.blockerId = -1;
  }

  blockAppSuspension() {
    if (!powerSaveBlocker.isStarted(this.blockerId)) {
      this.blockerId = powerSaveBlocker.start("prevent-display-sleep");
      log.info(`Did prevent-display-sleep call, blockerId=${this.blockerId}`);
    }
  }

  unblockAppSuspension() {
    if (powerSaveBlocker.isStarted(this.blockerId)) {
      powerSaveBlocker.stop(this.blockerId);
      log.info(`Removed prevent-display-sleep flag`);
      this.blockerId = -1;
    }
  }

  init() {
    if (process.argv.includes(NO_SLEEP_FLAG)) {
      log.info(
        "'nosleep' flag found on cli. Will prevent-display-sleep until process exit"
      );
      this.blockAppSuspension();
      return;
    }
    ipcMain.handle(WEB_TO_DESKTOP_CNC_ACTIVE, () => {
      log.info("WEB_TO_DESKTOP_CNC_ACTIVE received");
      this.blockAppSuspension();
    });
    ipcMain.handle(WEB_TO_DESKTOP_CNC_INACTIVE, () => {
      log.info("WEB_TO_DESKTOP_CNC_INACTIVE received");
      this.unblockAppSuspension();
    });
    log.info("Initialized");
  }
}
