import { app } from "electron";
import "./security";
import { restoreOrCreateWindow } from "./mainWindow";
import { initMain } from "./main";
import logger from "./logger";

const log = logger.scope("app");

log.info(
  `App started. pid=${process.pid}, cwd=${process.cwd()}, argv=[${
    process.argv
  }]`
);

/**
 * Prevent electron from running multiple instances.
 */
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  log.warn("Another app instance running. Exiting");
  app.quit();
  process.exit(0);
}
app.on("second-instance", restoreOrCreateWindow);

/**
 * Disable Hardware Acceleration to save more system resources.
 */
app.disableHardwareAcceleration();

/**
 * Shout down background process if all windows was closed
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * @see https://www.electronjs.org/docs/latest/api/app#event-activate-macos Event: 'activate'.
 */
app.on("activate", restoreOrCreateWindow);

app.on("render-process-gone", (e, web, details) => {
  log.error(
    `Renderer process gone. webId=${web.id}, reason=${details.reason}, code=${details.exitCode}`
  );
});

app.on("child-process-gone", (e, details) => {
  log.error(
    `Child process gone. type=${details.type}, name=${details.name}, serviceName=${details.serviceName}, reason=${details.reason}, code=${details.exitCode}`
  );
});

/**
 * Create the application window when the background process is ready.
 */
app
  .whenReady()
  .then(restoreOrCreateWindow)
  .then(initMain)
  .catch((e) => console.error("Failed create window:", e));
