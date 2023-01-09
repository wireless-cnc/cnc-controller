export const JOB_STATE_SLICE = "jobState";
export const MACHINE_STATE_SLICE = "machineState";
export const SERVICE_DISCOVERY_SLICE = "serviceDiscovery";

export type JobStatus =
  | "Not started"
  | "In progress"
  | "Finishing"
  | "Failed"
  | "Finished";
export type MachineStatus =
  | "Disconnected"
  | "Initial"
  | "Idle"
  | "Run"
  | "Hold"
  | "Jog"
  | "Alarm"
  | "Door"
  | "Check"
  | "Home";

export class Vector {
  x: number = 0;
  y: number = 0;
  z: number = 0;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  plus(other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  minus(other: Vector): Vector {
    return new Vector(this.x - other.x, this.y - other.y, this.z - other.z);
  }
}

export type StatusReportStruct = {
  status: MachineStatus;
  wpos?: Vector;
  mpos?: Vector;
  wco?: Vector;
};
