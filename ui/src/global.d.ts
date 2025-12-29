import { AppDispatch } from "./store";
import { GrblController } from "./grbl";

declare global {
  interface Window {
    electron: {
      pipe: (dispatch: AppDispatch) => void;
      notifyWebInitialized: () => void;
    };
    // Exposed controller instance for debug/advanced usage
    cnc?: GrblController;
  }
}
