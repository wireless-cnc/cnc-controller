import { Action } from ".";

export const cncDaemonOnline = (
  host: string,
  port: number,
  name: string
): Action => {
  return {
    type: "serviceDiscovery/cncDaemonOnline",
    payload: {
      host,
      port,
      name,
    },
  };
};

export const cncDaemonOffline = (
  host: string,
  port: number,
  name: string
): Action => {
  return {
    type: "serviceDiscovery/cncDaemonOffline",
    payload: {
      host,
      port,
      name,
    },
  };
};
