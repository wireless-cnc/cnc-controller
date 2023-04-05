import { WebDispatcher } from "./renderer";

(window as any).electron = {
  pipe: (arg: any) => {
    WebDispatcher.setDispatchFn(arg);
  },
  notifyWebInitialized: async () => {
    await WebDispatcher.notifyWebInitialized();
  },
  cncActive: async () => {
    await WebDispatcher.cncActive();
  },
  cncInactive: async () => {
    await WebDispatcher.cncInactive();
  },
};
