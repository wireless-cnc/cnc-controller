import { BrowserWindow } from "electron";
import { MDNSDiscovery } from "./MDNSDiscovery";

export const initMain = (window: BrowserWindow) => {
  const discoverer = new MDNSDiscovery(window);
};
