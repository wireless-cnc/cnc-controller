import {
  AnyAction,
  createSelector,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { RootState } from ".";
import { JobStatus, JOB_STATE_SLICE, MACHINE_STATE_SLICE } from "./types";
import { parseStatusReport } from "./utils";

interface JobState {
  status: JobStatus;
  fileName: string;
  lines: string[];
  linesProcessed: number;
  errorsCount: number;
}

const initialJobState: JobState = {
  status: "Not started",
  fileName: "",
  lines: [],
  linesProcessed: 0,
  errorsCount: 0,
};

export { JOB_STATE_SLICE } from "./types";

export const jobStateSlice = createSlice({
  name: JOB_STATE_SLICE,
  initialState: initialJobState,
  reducers: {
    setStatus: (state, action: PayloadAction<JobStatus>) => {
      state.status = action.payload;
    },
    setFileName: (state, action: PayloadAction<string>) => {
      state.fileName = action.payload;
    },
    incLinesProcessed: (state, action: AnyAction) => {
      state.linesProcessed += 1;
    },
    incErrorsCount: (state, action: AnyAction) => {
      state.errorsCount += 1;
    },
    resetJobState: (state, action: AnyAction) => {
      state.status = "Not started";
      state.fileName = "";
      state.linesProcessed = 0;
      state.lines = [];
      state.errorsCount = 0;
    },
    parseText: (state, action: PayloadAction<string>) => {
      state.lines = action.payload.split(/\r\n|\n/g);
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action: AnyAction) =>
        action.type === `${MACHINE_STATE_SLICE}/processStatusReport`,
      (state, action: PayloadAction<string>) => {
        if (state.status === "Finishing") {
          const res = parseStatusReport(action.payload);
          if (res.status === "Idle") {
            state.status = "Finished";
          }
        }
      }
    );
  },
});

const selectJobState = (state: RootState) => state[JOB_STATE_SLICE];
const selectLinesTotal = (state: RootState) =>
  state[JOB_STATE_SLICE].lines.length;
const selectLinesProcessed = (state: RootState) =>
  state[JOB_STATE_SLICE].linesProcessed;

const selectJobProgress = createSelector(
  selectLinesTotal,
  selectLinesProcessed,
  (total, processed) => Math.round((processed / total) * 100)
);

const selectLines = (state: RootState) => state[JOB_STATE_SLICE].lines;
const selectMachineStatus = (state: RootState) =>
  state[MACHINE_STATE_SLICE].status;
const selectJobStatus = (state: RootState) => state[JOB_STATE_SLICE].status;

const canStartJob = createSelector(
  selectLines,
  selectMachineStatus,
  selectJobStatus,
  (lines, machineStatus, jobStatus) =>
    lines.length > 0 && machineStatus === "Idle" && jobStatus === "Not started"
);

const canZeroCoordinates = createSelector(
  selectMachineStatus,
  selectJobStatus,
  (machineStatus, jobStatus) => {
    return machineStatus === "Idle" && jobStatus === "Not started";
  }
);

export const JobStateSelectors = {
  selectJobProgress,
  selectJobState,
  selectLinesTotal,
  selectLinesProcessed,
  selectLines,
  canStartJob,
  canZeroCoordinates,
};
