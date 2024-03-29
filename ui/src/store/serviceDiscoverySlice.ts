import { GrblController } from "@app/grbl";
import {
  createSelector,
  createSlice,
  PayloadAction,
  createListenerMiddleware,
  AnyAction,
} from "@reduxjs/toolkit";
import { RootState } from ".";
import {
  MachineStatus,
  MACHINE_STATE_SLICE,
  SERVICE_DISCOVERY_SLICE,
} from "./types";

interface ServiceInfo {
  host: string;
  port: number;
  name: string;
}

type ConnectivityState =
  | "searching"
  | "connecting"
  | "connected"
  | "disconnected";

interface ServiceDiscoveryState {
  connectivityState: ConnectivityState;
  active: ServiceInfo | null;
  discovered: Record<string, ServiceInfo>;
}

const initialServiceDiscoveryState: ServiceDiscoveryState = {
  connectivityState: "searching",
  active: null,
  discovered: {},
};

export { SERVICE_DISCOVERY_SLICE } from "./types";

export const serviceDiscoverySlice = createSlice({
  name: SERVICE_DISCOVERY_SLICE,
  initialState: initialServiceDiscoveryState,
  reducers: {
    cncDaemonOnline: (state, action: PayloadAction<ServiceInfo>) => {
      const service = action.payload;
      state.discovered[`${service.host}:${service.port}`] = service;
    },
    cncDaemonOffline: (state, action: PayloadAction<ServiceInfo>) => {
      const service = action.payload;
      delete state.discovered[`${service.host}:${service.port}`];
      if (Object.keys(state.discovered).length === 0) {
        state.connectivityState = "searching";
      }
    },
    connectTo: (state, action: PayloadAction<ServiceInfo>) => {
      state.active = action.payload;
      state.connectivityState = "connecting";
    },
    setConnectivityState: (state, action: PayloadAction<ConnectivityState>) => {
      state.connectivityState = action.payload;
    },
    reconnect: (state, _: AnyAction) => {
      // do nothing
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action: AnyAction) => action.type === `${MACHINE_STATE_SLICE}/setStatus`,
      (state, action: PayloadAction<MachineStatus>) => {
        const status = action.payload;
        if (status === "Disconnected") {
          state.connectivityState = "disconnected";
        } else {
          state.connectivityState = "connected";
        }
      }
    );
  },
});

const selectDiscoveredServices = (state: RootState) =>
  Object.values(state[SERVICE_DISCOVERY_SLICE].discovered);

const canSelectCNC = createSelector(
  selectDiscoveredServices,
  (discovered) => discovered.length > 0
);

const selectConnectivityState = (state: RootState) =>
  state[SERVICE_DISCOVERY_SLICE].connectivityState;

const _selectDiscoveredServicesMap = (state: RootState) =>
  state[SERVICE_DISCOVERY_SLICE].discovered;
const _selectId = (state: RootState, id: string) => id;

const selectServiceInfoById = createSelector(
  [_selectDiscoveredServicesMap, _selectId],
  (discovered, serviceId: string) => {
    return discovered[serviceId];
  }
);

export const ServiceDiscoverySelectors = {
  selectDiscoveredServices,
  canSelectCNC,
  selectConnectivityState,
  selectServiceInfoById,
};

type ListenerMiddleware = ReturnType<typeof createListenerMiddleware>;

export const listenConnectToAction = (
  listenerMiddleware: ListenerMiddleware,
  grblController: GrblController
) => {
  listenerMiddleware.startListening({
    actionCreator: serviceDiscoverySlice.actions.connectTo,
    effect: async (action, listenerApi) => {
      const { host, port } = action.payload;
      grblController.disconnect();
      await grblController.connect(host, port);
    },
  });
};

export const listenToCNCDaemonOnline = (
  listenerMiddleware: ListenerMiddleware
) => {
  listenerMiddleware.startListening({
    actionCreator: serviceDiscoverySlice.actions.cncDaemonOnline,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState() as RootState;
      const { active, discovered } = state[SERVICE_DISCOVERY_SLICE];
      if (!active && Object.keys(discovered).length === 1) {
        listenerApi.dispatch(
          serviceDiscoverySlice.actions.connectTo(action.payload)
        );
      }
    },
  });
};

export const listenToReconnectAction = (
  listenerMiddleware: ListenerMiddleware
) => {
  listenerMiddleware.startListening({
    actionCreator: serviceDiscoverySlice.actions.reconnect,
    effect: async (_, listenerApi) => {
      const state = listenerApi.getState() as RootState;
      const { active } = state[SERVICE_DISCOVERY_SLICE];
      if (active) {
        listenerApi.dispatch(serviceDiscoverySlice.actions.connectTo(active));
      }
    },
  });
};
