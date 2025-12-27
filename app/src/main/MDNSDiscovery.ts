import { BrowserWindow, ipcMain } from "electron";
import { spawn } from "child_process";
import Bonjour from "bonjour-service";
import { dispatchToWeb } from "./utils";
import { cncDaemonOnline, cncDaemonOffline } from "../api/actions";
import { WEB_TO_DESKTOP_WEB_INITIALIZED } from "../api";
import logger from "../logger";

const MDNS_UPDATE_INTERVAL_MS = 10000;
const log = logger.scope("mDNS");
export class MDNSDiscovery {
  private bonjour: any;
  private browser: any;
  private updateInterval: NodeJS.Timeout | null = null;
  private discoveredServices: Map<string, any> = new Map();
  private dnsSdProcess: any = null;

  constructor(window: BrowserWindow) {

    log.info("Initializing mDNS discovery...");
    
    const isMac = process.platform === "darwin";
    
    if (isMac) {
      log.info("Using macOS dns-sd fallback for mDNS discovery");
      this.useDnsSdFallback(window);
    } else {
      log.info("Using bonjour-service for mDNS discovery");
      this.useBonjourService(window);
    }

    ipcMain.handle(WEB_TO_DESKTOP_WEB_INITIALIZED, () => {
      log.info("WEB_TO_DESKTOP_WEB_INITIALIZED event received");
      log.info(`Found ${this.discoveredServices.size} suitable services so far`);
      for (let service of this.discoveredServices.values()) {
        dispatchToWeb(
          window,
          cncDaemonOnline(service.host, service.port, service.name)
        );
        log.info(
          `-> Web:  host=${service.host}, port=${service.port}, name=${service.name}`
        );
      }
    });
  }

  private useDnsSdFallback(window: BrowserWindow) {
    // Start a persistent dns-sd process
    const startDnsSdBrowser = () => {
      log.info("Starting dns-sd browser process...");
      
      this.dnsSdProcess = spawn("dns-sd", ["-B", "_http._tcp", "local"], {
        stdio: ["ignore", "pipe", "pipe"]
      });

      this.dnsSdProcess.stdout.on("data", (data: Buffer) => {
        const output = data.toString();
        const lines = output.split("\n");
        
        for (const line of lines) {
          // Look for lines like: "Add        2  14 local.               _http._tcp.          ESP_A8C984"
          const addMatch = line.match(/Add\s+\d+\s+\d+\s+\S+\s+_http\._tcp\.\s+(.+)/);
          if (addMatch) {
            const serviceName = addMatch[1].trim();
            
            if (!this.discoveredServices.has(serviceName)) {
              log.info(`🔼 Service discovered: ${serviceName}`);
              // New service, get its details
              this.getServiceDetailsSync(window, serviceName);
            }
          }
          
          // Look for remove lines
          const removeMatch = line.match(/Rmv\s+\d+\s+\d+\s+\S+\s+_http\._tcp\.\s+(.+)/);
          if (removeMatch) {
            const serviceName = removeMatch[1].trim();
            const service = this.discoveredServices.get(serviceName);
            if (service) {
              log.info(`🔽 Service DOWN: ${serviceName}`);
              dispatchToWeb(window, cncDaemonOffline(service.host, service.port, service.name));
              this.discoveredServices.delete(serviceName);
            }
          }
        }
      });

      this.dnsSdProcess.stderr.on("data", (data: Buffer) => {
        log.error(`dns-sd error: ${data.toString()}`);
      });

      this.dnsSdProcess.on("error", (error: Error) => {
        log.error(`Failed to start dns-sd: ${error.message}`);
        // Retry after a delay
        setTimeout(() => startDnsSdBrowser(), 5000);
      });

      this.dnsSdProcess.on("close", (code: number) => {
        log.info(`dns-sd process closed with code ${code}`);
        // Restart if it crashes
        if (code !== 0) {
          setTimeout(() => startDnsSdBrowser(), 5000);
        }
      });
    };
    
    startDnsSdBrowser();
    log.info("mDNS discovery initialized with dns-sd");
  }

  private getServiceDetailsSync(window: BrowserWindow, serviceName: string) {
    try {
      // Use a simple spawn with timeout for lookup
      const lookup = spawn("dns-sd", ["-L", serviceName, "_http._tcp", "local"], {
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 3000
      });

      let output = "";
      lookup.stdout.on("data", (data: Buffer) => {
        output += data.toString();
      });

      lookup.on("close", () => {
        // Parse output like: "ESP_A8C984._http._tcp.local. can be reached at ESP_A8C984.local.:81"
        const hostMatch = output.match(/can be reached at ([^:]+):(\d+)/);
        if (hostMatch) {
          const [, host, port] = hostMatch;
          const service = { name: serviceName, host, port: parseInt(port) };
          this.discoveredServices.set(serviceName, service);
          
          log.info(`✅ Service details: name=${serviceName}, host=${host}, port=${port}`);
          dispatchToWeb(window, cncDaemonOnline(host, parseInt(port), serviceName));
        }
      });

      lookup.on("error", (error: Error) => {
        log.error(`Error looking up ${serviceName}: ${error.message}`);
      });
    } catch (error) {
      log.error(`Error getting service details for ${serviceName}: ${error}`);
    }
  }

  private useBonjourService(window: BrowserWindow) {
    this.bonjour = new Bonjour();
    log.info(`Bonjour instance created`);
    
    this.browser = this.bonjour.find({ type: "http" });
    log.info(`Browser created, looking for _http._tcp services`);
    
    this.browser.on("up", (service: any) => {
      log.info(`🔼 Service UP: name=${service.name}, host=${service.host}, port=${service.port}`);
      this.discoveredServices.set(service.name, service);
      dispatchToWeb(window, cncDaemonOnline(service.host, service.port, service.txt?.name || service.name));
    });

    this.browser.on("down", (service: any) => {
      log.info(`🔽 Service DOWN: name=${service.name}`);
      this.discoveredServices.delete(service.name);
      dispatchToWeb(window, cncDaemonOffline(service.host, service.port, service.txt?.name || service.name));
    });
    
    this.browser.on("error", (error: any) => {
      log.error(`❌ mDNS Browser error: ${error}`);
    });

    this.browser.start();
    log.info("Started mDNS browser");

    this.browser.update();

    this.updateInterval = setInterval(() => {
      log.info(`Running scheduled mDNS scan (${this.discoveredServices.size} services known)`);
      this.browser.update();
    }, MDNS_UPDATE_INTERVAL_MS);

    log.info(`Scheduled mDNS scans every ${MDNS_UPDATE_INTERVAL_MS} ms`);
  }
}
