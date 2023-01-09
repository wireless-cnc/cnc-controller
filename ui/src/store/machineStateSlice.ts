import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".";
import { MachineStatus, Vector, MACHINE_STATE_SLICE } from "./types";
import { parseStatusReport } from "./utils";

interface MachineState {
  status: MachineStatus;
  workPos: Vector;
  machinePos: Vector;
  wco: Vector;
}

const initialMachineState: MachineState = {
  status: "Disconnected",
  workPos: new Vector(0, 0, 0),
  machinePos: new Vector(0, 0, 0),
  wco: new Vector(0, 0, 0),
};

export { MACHINE_STATE_SLICE } from "./types";

export const machineStateSlice = createSlice({
  name: MACHINE_STATE_SLICE,
  initialState: initialMachineState,
  reducers: {
    processStatusReport: (state, action: PayloadAction<string>) => {
      const res = parseStatusReport(action.payload);
      state.status = res.status;
      if (res.mpos) {
        state.machinePos = res.mpos;
        if (res.wco) {
          state.wco = res.wco;
        }
        state.workPos = res.mpos.minus(state.wco);
      }
      if (res.wpos) {
        state.workPos = res.wpos;
        if (res.wco) {
          state.wco = res.wco;
        }
        state.machinePos = res.wpos.plus(state.wco);
      }
    },
    setStatus: (state, action: PayloadAction<MachineStatus>) => {
      state.status = action.payload;
    },
  },
});

const selectStatus = (state: RootState): MachineStatus => {
  return state[MACHINE_STATE_SLICE].status;
};

const selectWorkPos = (state: RootState): Vector => {
  return state[MACHINE_STATE_SLICE].workPos;
};

const selectMachinePos = (state: RootState): Vector => {
  return state[MACHINE_STATE_SLICE].machinePos;
};

const canUnlock = createSelector(selectStatus, (status) => {
  const statuses: MachineStatus[] = ["Alarm", "Door"];
  return statuses.includes(status);
});

const canHold = createSelector(selectStatus, (status) => {
  const statuses: MachineStatus[] = ["Disconnected", "Alarm", "Door", "Hold"];
  return !statuses.includes(status);
});

const canResume = createSelector(selectStatus, (status) => {
  return status === "Hold";
});

const canReset = createSelector(selectStatus, (status) => {
  return status !== "Disconnected";
});

export const MachineStateSelectors = {
  selectStatus,
  selectWorkPos,
  selectMachinePos,
  canUnlock,
  canHold,
  canResume,
  canReset,
};
