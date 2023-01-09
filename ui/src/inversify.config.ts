import { Container } from "inversify";
import {
  GrblController,
  MachineStateHandler,
  JobStateHandler,
  GCodeFileWriter,
} from "./grbl";
import { TYPES } from "./inversify.types";
import { AppDispatch, store } from "./store";

const appContainer = new Container();
appContainer
  .bind<GrblController>(TYPES.GrblController)
  .to(GrblController)
  .inSingletonScope();
appContainer.bind<AppDispatch>(TYPES.AppDispatch).toFunction(store.dispatch);
appContainer
  .bind<MachineStateHandler>(TYPES.MachineStateHandler)
  .to(MachineStateHandler)
  .inSingletonScope();
appContainer
  .bind<JobStateHandler>(TYPES.JobStateHandler)
  .to(JobStateHandler)
  .inSingletonScope();
appContainer.bind<GCodeFileWriter>(TYPES.GCodeFileWriter).to(GCodeFileWriter);

export { appContainer };
