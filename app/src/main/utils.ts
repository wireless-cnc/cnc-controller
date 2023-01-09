import { BrowserWindow } from "electron";
import { Action, DESKTOP_TO_WEB_DISPATCH_CHANNEL } from "../api";

export const dispatchToWeb = (window: BrowserWindow, action: Action) => {
  window.webContents.send(DESKTOP_TO_WEB_DISPATCH_CHANNEL, action);
};
