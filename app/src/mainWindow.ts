import { BrowserWindow } from "electron";
import type { BrowserWindowConstructorOptions } from "electron";
import { URL } from "url";
import logger from "./logger";
import { loadWindowSize, persistWindowSize } from "./windowSizeStorage";

const log = logger.scope("window");
const WINDOW_SIZE_DEBOUNCE_MS = 300;

function resolveInitialDimension(
  savedValue: number | undefined,
  fallback: number
) {
  if (
    typeof savedValue === "number" &&
    Number.isFinite(savedValue) &&
    savedValue > 0
  ) {
    return Math.max(Math.round(savedValue), fallback);
  }

  return fallback;
}

function enableWindowSizePersistence(
  browserWindow: BrowserWindow,
  minWidth: number,
  minHeight: number
) {
  let debounceTimer: NodeJS.Timeout | undefined;

  const saveSize = () => {
    if (browserWindow.isDestroyed()) {
      return;
    }

    const { width, height } = browserWindow.getBounds();
    persistWindowSize({
      width: Math.max(width, minWidth),
      height: Math.max(height, minHeight),
    });
  };

  const scheduleSave = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      saveSize();
    }, WINDOW_SIZE_DEBOUNCE_MS);
  };

  browserWindow.on("resize", scheduleSave);
  browserWindow.on("close", () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }

    saveSize();
  });
  browserWindow.on("closed", () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }
  });
}

async function createWindow() {
  const windowOptions: BrowserWindowConstructorOptions = {
    minWidth: 1024,
    minHeight: 650,
    autoHideMenuBar: true,
    trafficLightPosition: {
      x: 20,
      y: 32,
    },
    webPreferences: {
      contextIsolation: false,
      spellcheck: false,
      nodeIntegration: false,
      webviewTag: false,
      sandbox: false,
      preload: __dirname + "/preload.js",
      backgroundThrottling: false,
    },
    show: false,
  };

  const savedWindowSize = loadWindowSize();
  const fallbackWidth = windowOptions.minWidth ?? 1024;
  const fallbackHeight = windowOptions.minHeight ?? 650;
  const browserWindow = new BrowserWindow({
    ...windowOptions,
    width: resolveInitialDimension(savedWindowSize?.width, fallbackWidth),
    height: resolveInitialDimension(savedWindowSize?.height, fallbackHeight),
  });

  log.info("Window instance created");
  // Persist the real window size so we can restore it on the next launch.
  enableWindowSizePersistence(browserWindow, fallbackWidth, fallbackHeight);

  /**
   * If the 'show' property of the BrowserWindow's constructor is omitted from the initialization options,
   * it then defaults to 'true'. This can cause flickering as the window loads the html content,
   * and it also has show problematic behaviour with the closing of the window.
   * Use `show: false` and listen to the  `ready-to-show` event to show the window.
   *
   * @see https://github.com/electron/electron/issues/25012 for the afford mentioned issue.
   */
  browserWindow.on("ready-to-show", () => {
    browserWindow?.show();
    log.info("Window displayed");
    const web = browserWindow.webContents;
    web.on("console-message", (e, level, message, line, sourceId) => {
      log.info(
        `Web console: src=${sourceId}, ln=${line}, level=${level}, msg=${message}`
      );
    });
  });

  browserWindow.on("unresponsive", () => {
    log.warn("Window is not responding");
  });

  browserWindow.on("responsive", () => {
    log.warn("Window now responsive");
  });

  /**
   * URL for main window.
   * Vite dev server for development.
   * `file://../renderer/index.html` for production and test.
   */
  const pageUrl = process.env.REACT_APP_STATIC_SERVER_PORT
    ? `http://localhost:${process.env.REACT_APP_STATIC_SERVER_PORT}`
    : new URL("dist/renderer/index.html", "file://" + __dirname).toString();

  await browserWindow.loadURL(pageUrl);
  log.debug(`Start loading ${pageUrl}`);

  return browserWindow;
}

/**
 * Restore an existing BrowserWindow or Create a new BrowserWindow.
 */
export async function restoreOrCreateWindow() {
  let window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());

  if (window === undefined) {
    window = await createWindow();
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.focus();
  return window;
}
