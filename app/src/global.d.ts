declare global {
  interface IElectronAPI {
    pipe: (dispatch: (action: any) => void) => void;
    notifyWebInitialized: () => void;
  }

  interface Window {
    electron: IElectronAPI;
  }
}

declare module "mdns-js" {
  interface MdnsBrowser {
    on(event: string, callback: (...args: any[]) => void): void;
    discover(): void;
  }

  class MdnsJsLib {
    createBrowser(): MdnsBrowser;
  }
  export default new MdnsJsLib();
}
