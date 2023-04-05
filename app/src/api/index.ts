export interface Action {
  type: string;
  payload?: any;
}

export const DESKTOP_TO_WEB_DISPATCH_CHANNEL = "DesktopToWeb::dispatch";
export const WEB_TO_DESKTOP_WEB_INITIALIZED = "WebToDesktop::webInitialized";
export const WEB_TO_DESKTOP_CNC_ACTIVE = "WebToDesktop::cncActive";
export const WEB_TO_DESKTOP_CNC_INACTIVE = "WebToDesktop::cncInactive";
