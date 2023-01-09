import { BrowserWindow, ipcMain } from "electron";
import Bonjour from "bonjour-service";
import { dispatchToWeb } from "./utils";
import { cncDaemonOnline, cncDaemonOffline } from "../api/actions";
import { WEB_TO_DESKTOP_WEB_INITIALIZED } from "../api";

export class MDNSDiscovery {
  constructor(window: BrowserWindow) {
    const bonjour = new Bonjour();
    const browser = bonjour.find({ type: "http", txt: { type: "cnc" } });
    browser.on("up", (service) => {
      dispatchToWeb(
        window,
        cncDaemonOnline(service.host, service.port, service.txt.name)
      );
    });
    browser.on("down", (service) => {
      dispatchToWeb(
        window,
        cncDaemonOffline(service.host, service.port, service.txt.name)
      );
    });
    browser.start();
    setInterval(() => {
      browser.update();
    }, 10000);
    ipcMain.handle(WEB_TO_DESKTOP_WEB_INITIALIZED, () => {
      for (let service of browser.services) {
        dispatchToWeb(
          window,
          cncDaemonOnline(service.host, service.port, service.txt.name)
        );
      }
    });
  }
}
