import { ButtonProps } from "react-bootstrap/esm/Button";
import { AiFillPauseCircle, AiFillPlayCircle } from "react-icons/ai";
import { IconButton } from "./icon-button.component";
import { MachineStateSelectors } from "@app/store";
import { useSelector } from "react-redux";
import { useContext } from "react";
import { ControllerContext } from "@app/context";
const { canResume } = MachineStateSelectors;

export const HoldResumeButton = (props: ButtonProps) => {
  const resume = useSelector(canResume);
  const controller = useContext(ControllerContext);
  const icon = resume ? <AiFillPlayCircle /> : <AiFillPauseCircle />;
  const tooltip = resume ? "Resume" : "Hold";
  return (
    <IconButton
      icon={icon}
      tooltip={tooltip}
      onClick={() => {
        if (resume) {
          controller?.sendResume();
        } else {
          controller?.sendHold();
        }
      }}
      {...props}
    />
  );
};
