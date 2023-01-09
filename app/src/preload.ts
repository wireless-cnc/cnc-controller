import { WebDispatcher } from "./renderer";

(window as any).electron = {
  pipe: (arg: any) => {
    WebDispatcher.setDispatchFn(arg);
  },
  notifyWebInitialized: async () => {
    await WebDispatcher.notifyWebInitialized();
  },
};
