import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";

import { machineStateSlice, MACHINE_STATE_SLICE } from "./machineStateSlice";
import { JOB_STATE_SLICE, jobStateSlice } from "./jobStateSlice";
import {
  SERVICE_DISCOVERY_SLICE,
  serviceDiscoverySlice,
} from "./serviceDiscoverySlice";

export const listenerMiddleware = createListenerMiddleware();

export const store = configureStore({
  reducer: {
    [MACHINE_STATE_SLICE]: machineStateSlice.reducer,
    [JOB_STATE_SLICE]: jobStateSlice.reducer,
    [SERVICE_DISCOVERY_SLICE]: serviceDiscoverySlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).prepend(listenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const MachineStateActions = machineStateSlice.actions;
export const JobActions = jobStateSlice.actions;

export { MachineStateSelectors } from "./machineStateSlice";
export { JobStateSelectors } from "./jobStateSlice";
export {
  ServiceDiscoverySelectors,
  listenConnectToAction,
  listenToCNCDaemonOnline,
} from "./serviceDiscoverySlice";
