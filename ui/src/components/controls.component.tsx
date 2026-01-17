import styled from "styled-components";
import Card from "react-bootstrap/Card";
import { IconButton } from "./icon-button.component";
import { StyledCardBody, StyledCardTitle } from "./styled-card-body.component";

import { BiReset } from "react-icons/bi";
import { AiFillUnlock } from "react-icons/ai";
import { FaCreativeCommonsZero } from "react-icons/fa";
import { HoldResumeButton } from "./hold-resume-button.component";
import { GrblSettingsDialog } from "./grbl-settings-dialog.component";
import { JobStateSelectors, MachineStateSelectors } from "@app/store";
import { useSelector } from "react-redux";
import { useContext, useState } from "react";
import { ControllerContext } from "@app/context";
import { AiOutlineSetting } from "react-icons/ai";
const { canReset, canUnlock, canHold, canResume } = MachineStateSelectors;
const StyledCard = styled(Card)`
  margin-top: 0.5rem;
`;

export const ControlsWidget = () => {
  const resetDisabled = !useSelector(canReset);
  const unlockDisabled = !useSelector(canUnlock);
  const holdDisabled = !useSelector(canHold);
  const resumeDisabled = !useSelector(canResume);
  const zeroCoordsDisabled = !useSelector(JobStateSelectors.canZeroCoordinates);
  const isDisconnected =
    useSelector(MachineStateSelectors.selectStatus) === "Disconnected";
  const controller = useContext(ControllerContext);
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <StyledCard>
      <StyledCardBody>
        <StyledCardTitle>Controls</StyledCardTitle>
        <Card.Text>
          <IconButton
            icon={<BiReset />}
            tooltip="Reset"
            disabled={resetDisabled}
            onClick={() => {
              controller?.sendReset();
            }}
          />
          <IconButton
            icon={<AiFillUnlock />}
            tooltip="Unlock"
            disabled={unlockDisabled}
            onClick={() => {
              controller?.sendUnlock();
            }}
          />
          <HoldResumeButton disabled={holdDisabled && resumeDisabled} />
          <IconButton
            icon={<FaCreativeCommonsZero />}
            tooltip="Zero coordinates"
            onClick={() => {
              controller?.sendZeroCoordinates();
            }}
            disabled={zeroCoordsDisabled}
          />
          <IconButton
            icon={<AiOutlineSetting />}
            tooltip="Settings"
            disabled={isDisconnected}
            onClick={() => setSettingsOpen(true)}
          />
        </Card.Text>
      </StyledCardBody>
      <GrblSettingsDialog
        show={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </StyledCard>
  );
};
