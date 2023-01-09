import React from "react";
import { IController, JobStateHandler } from "./grbl";

type Nullable<T> = T | null;
export const ControllerContext =
  React.createContext<Nullable<IController>>(null);

export const JobHandlerContext =
  React.createContext<Nullable<JobStateHandler>>(null);
