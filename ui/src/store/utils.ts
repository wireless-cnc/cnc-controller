import { MachineStatus, StatusReportStruct, Vector } from "./types";

type Triple<T> = [T, T, T];

export const parseStatusReport = (input: string) => {
  let result: StatusReportStruct = {
    status: "Disconnected",
  };
  const MPOS_TOKEN = "MPos:";
  const WPOS_TOKEN = "WPos:";
  const WCO_TOKEN = "WCO:";
  if (input.indexOf("<") !== 0) {
    throw new Error("Invalid status report format");
  }
  const trimmed_input = input.slice(1, -1);
  let report_parts = trimmed_input.split("|");
  if (report_parts.length < 2) {
    throw new Error("Invalid status report format");
  }
  const [status, pos] = report_parts;
  if (status.includes(":")) {
    result.status = status.slice(0, status.indexOf(":")) as MachineStatus;
  } else {
    result.status = status as MachineStatus;
  }
  if (pos.startsWith(MPOS_TOKEN)) {
    const xyz = pos
      .slice(MPOS_TOKEN.length)
      .split(",")
      .map(parseFloat) as Triple<number>;
    result.mpos = new Vector(...xyz);
  } else {
    const xyz = pos
      .slice(WPOS_TOKEN.length)
      .split(",")
      .map(parseFloat) as Triple<number>;
    result.wpos = new Vector(...xyz);
  }
  report_parts = report_parts.slice(2);
  const wco_string = report_parts.find((value) => value.includes(WCO_TOKEN));
  if (wco_string) {
    const xyz = wco_string
      .slice(WCO_TOKEN.length)
      .split(",")
      .map(parseFloat) as Triple<number>;
    result.wco = new Vector(...xyz);
  }
  return result;
};
