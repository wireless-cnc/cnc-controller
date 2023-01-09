import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { IconContext } from "react-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import { App } from "./App";
import { store } from "./store";
import { ControllerContext, JobHandlerContext } from "./context";
import { SystemController } from "./system";

const main = async () => {
  const { controller, jobStateHandler } = SystemController.init();

  ReactDOM.render(
    <IconContext.Provider value={{ style: { marginTop: "-0.3rem" } }}>
      <Provider store={store}>
        <ControllerContext.Provider value={controller}>
          <JobHandlerContext.Provider value={jobStateHandler}>
            <App />
          </JobHandlerContext.Provider>
        </ControllerContext.Provider>
      </Provider>
    </IconContext.Provider>,
    document.getElementById("root")
  );
};

main();
