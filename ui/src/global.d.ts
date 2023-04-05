import { AppDispatch } from "./store";

declare global {
  interface Window {
    electron: {
      pipe: (dispatch: AppDispatch) => void;
      notifyWebInitialized: () => void;
      cncInactive: () => void;
      cncActive: () => void;
    };
  }
}
