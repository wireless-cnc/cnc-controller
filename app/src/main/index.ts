import { BrowserWindow } from "electron";
import { MDNSDiscovery } from "./MDNSDiscovery";
import { PowerSaverController } from "./PowerSaverController";

export const initMain = (window: BrowserWindow) => {
  const discoverer = new MDNSDiscovery(window);
  const powerSaverController = new PowerSaverController();
  powerSaverController.init();
};
