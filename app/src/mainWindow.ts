import { BrowserWindow } from "electron";
import type { BrowserWindowConstructorOptions } from "electron";
import { URL } from "url";
import windowStateKeeper from "electron-window-state";

async function createWindow() {
  const windowOptions: BrowserWindowConstructorOptions = {
    minWidth: 1024,
    minHeight: 600,
    autoHideMenuBar: true,
    trafficLightPosition: {
      x: 20,
      y: 32,
    },
    webPreferences: {
      contextIsolation: false,
      devTools: true,
      spellcheck: false,
      nodeIntegration: false,
      webviewTag: false,
      sandbox: false,
      preload: __dirname + "/preload.js",
      backgroundThrottling: false,
    },
    show: false,
  };

  const windowState = windowStateKeeper({
    defaultWidth: windowOptions.minWidth,
    defaultHeight: windowOptions.minHeight,
  });

  const browserWindow = new BrowserWindow({
    ...windowOptions,
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
  });

  /**
   * If the 'show' property of the BrowserWindow's constructor is omitted from the initialization options,
   * it then defaults to 'true'. This can cause flickering as the window loads the html content,
   * and it also has show problematic behaviour with the closing of the window.
   * Use `show: false` and listen to the  `ready-to-show` event to show the window.
   *
   * @see https://github.com/electron/electron/issues/25012 for the afford mentioned issue.
   */
  browserWindow.on("ready-to-show", () => {
    browserWindow?.webContents.openDevTools();
    browserWindow?.show();
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
