import {
  Action,
  DESKTOP_TO_WEB_DISPATCH_CHANNEL,
  WEB_TO_DESKTOP_WEB_INITIALIZED,
} from "../api";
import { ipcRenderer } from "electron";

type DispatchFunction = (action: Action) => void;

class WebDispatch {
  private _dispatch: DispatchFunction | null;

  constructor() {
    ipcRenderer.on(DESKTOP_TO_WEB_DISPATCH_CHANNEL, (event, action: Action) => {
      this._handleIpc(event, action);
    });
    this._dispatch = null;
  }

  setDispatchFn(dispatch: DispatchFunction) {
    this._dispatch = dispatch;
  }

  async notifyWebInitialized() {
    await ipcRenderer.invoke(WEB_TO_DESKTOP_WEB_INITIALIZED);
  }

  private _handleIpc(_: Electron.IpcRendererEvent, action: Action) {
    if (this._dispatch) {
      this._dispatch(action);
    }
  }
}

export const WebDispatcher = new WebDispatch();
