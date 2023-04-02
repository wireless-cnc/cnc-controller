import { BrowserWindow, ipcMain } from "electron";
import Bonjour from "bonjour-service";
import { dispatchToWeb } from "./utils";
import { cncDaemonOnline, cncDaemonOffline } from "../api/actions";
import { WEB_TO_DESKTOP_WEB_INITIALIZED } from "../api";
import logger from "../logger";

const MDNS_UPDATE_INTERVAL_MS = 10000;
const log = logger.scope("mDNS");
export class MDNSDiscovery {
  constructor(window: BrowserWindow) {
    const bonjour = new Bonjour();
    const browser = bonjour.find({ type: "http", txt: { type: "cnc" } });
    browser.on("up", (service) => {
      dispatchToWeb(
        window,
        cncDaemonOnline(service.host, service.port, service.txt.name)
      );
      log.info(
        `-> Web:  cncDaemonOnline host=${service.host}, port=${service.port}, name=${service.txt.name}`
      );
    });
    browser.on("down", (service) => {
      dispatchToWeb(
        window,
        cncDaemonOffline(service.host, service.port, service.txt.name)
      );
      log.info(
        `-> Web:  cncDaemonOffline host=${service.host}, port=${service.port}, name=${service.txt.name}`
      );
    });
    browser.start();
    log.info("Started mDNS browser");
    setInterval(() => {
      browser.update();
    }, MDNS_UPDATE_INTERVAL_MS);
    log.info(`Scheduled mDNS scans every ${MDNS_UPDATE_INTERVAL_MS} ms`);
    ipcMain.handle(WEB_TO_DESKTOP_WEB_INITIALIZED, () => {
      log.info("WEB_TO_DESKTOP_WEB_INITIALIZED event received");
      log.info(`Found ${browser.services.length} suitable services so far`);
      for (let service of browser.services) {
        dispatchToWeb(
          window,
          cncDaemonOnline(service.host, service.port, service.txt.name)
        );
        log.info(
          `-> Web:  host=${service.host}, port=${service.port}, name=${service.txt.name}`
        );
      }
    });
  }
}
