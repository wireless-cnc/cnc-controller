import {
  GrblController,
  GrblHandlersGroup,
  JobStateHandler,
  MachineStateHandler,
  GrblSettingsHandler,
} from "./grbl";
import { appContainer } from "./inversify.config";
import { TYPES } from "./inversify.types";
import {
  store,
  listenerMiddleware,
  listenConnectToAction,
  listenToCNCDaemonOnline,
} from "./store";
import { listenToReconnectAction } from "./store/serviceDiscoverySlice";

export class SystemController {
  private static _initElectron() {
    if (window.electron) {
      window.electron.pipe(store.dispatch);
      window.electron.notifyWebInitialized();
    }
  }

  private static _initGrbl() {
    const controller = appContainer.get<GrblController>(TYPES.GrblController);
    const handlers = new GrblHandlersGroup();
    const machineStateHandler = appContainer.get<MachineStateHandler>(
      TYPES.MachineStateHandler
    );
    const jobStateHandler = appContainer.get<JobStateHandler>(
      TYPES.JobStateHandler
    );
    const grblSettingsHandler = appContainer.get<GrblSettingsHandler>(
      TYPES.GrblSettingsHandler
    );
    handlers.addHandler(machineStateHandler);
    handlers.addHandler(jobStateHandler);
    handlers.addHandler(grblSettingsHandler);
    controller.setHandler(handlers);
    return {
      controller,
      jobStateHandler,
    };
  }

  private static _initListenerMiddleware(grblController: GrblController) {
    listenConnectToAction(listenerMiddleware, grblController);
    listenToCNCDaemonOnline(listenerMiddleware);
    listenToReconnectAction(listenerMiddleware);
  }

  static init() {
    setTimeout(() => {
      this._initElectron();
    }, 1000);
    const { controller, jobStateHandler } = this._initGrbl();
    // Expose full GrblController instance for debugging and raw access
    (window as any).cnc = controller;
    this._initListenerMiddleware(controller);
    return { controller, jobStateHandler };
  }
}
