import styled from "styled-components";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import ProgressBar from "react-bootstrap/ProgressBar";
import { BsCheckCircle, BsPlayCircle } from "react-icons/bs";

import { DropArea } from "./dropzone.component";
import { IconButton } from "./icon-button.component";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, JobActions, JobStateSelectors } from "@app/store";
import { GCodeFileWriter } from "@app/grbl";
import { useCallback, useContext, useEffect } from "react";
import { ControllerContext, JobHandlerContext } from "@app/context";
import { MessageBox } from "./message-box.component";
import { appContainer } from "@app/inversify.config";
import { TYPES } from "@app/inversify.types";

const { selectJobState, selectJobProgress, selectLines, canStartJob } =
  JobStateSelectors;

const StyledCard = styled(Card)`
  margin-top: 0.5rem;
`;

const ColumnContainer = styled(Container)`
  flex-direction: column;
  margin-top: 1rem;
`;

const ProgressBarContainer = styled(Container)`
  margin-top: 1rem;
`;

const ButtonsContainer = styled(Container)`
  flex-direction: row;
  margin-top: 1rem;
`;

const JobStatusNotification = () => {
  const jobState = useSelector(selectJobState);
  const dispatch = useDispatch<AppDispatch>();
  const resetJobState = useCallback(() => {
    dispatch(JobActions.resetJobState());
  }, [dispatch]);
  switch (jobState.status) {
    case "Finished":
      return (
        <MessageBox
          show
          title="Success"
          text="Job has finished successfully."
          type="Info"
          onClose={resetJobState}
        />
      );
    case "Failed":
      return (
        <MessageBox
          show
          title="Failed"
          text="Job has failed. Please reset CNC"
          type="Warning"
          onClose={resetJobState}
        />
      );
    default:
      return null;
  }
};

export const JobCardWidget = () => {
  const jobState = useSelector(selectJobState);
  const progress = useSelector(selectJobProgress) || 0;
  const buttonsEnabled = useSelector(canStartJob);
  const handler = useContext(JobHandlerContext);
  const controller = useContext(ControllerContext);
  const dispatch = useDispatch<AppDispatch>();
  const lines = useSelector(selectLines);
  const animatedProgress =
    jobState.status === "In progress" || jobState.status === "Finishing";
  let barVariant = undefined;
  if (jobState.status === "Failed") {
    barVariant = "danger";
  }
  if (jobState.status === "Finished") {
    barVariant = "success";
  }
  useEffect(() => {
    if (jobState.status === "Finished" || jobState.status === "Failed") {
      handler?.setWriter(undefined);
    }
  }, [jobState, handler]);
  return (
    <StyledCard>
      <Card.Body>
        <Card.Title>CNC job</Card.Title>
        <ColumnContainer>
          <DropArea />
          {jobState.fileName && (
            <ButtonsContainer>
              <span>{`${jobState.fileName} - ${jobState.linesProcessed} / ${jobState.lines.length}`}</span>
            </ButtonsContainer>
          )}
          <ProgressBarContainer>
            <ProgressBar
              variant={barVariant}
              animated={animatedProgress}
              now={progress}
              label={`${progress}%`}
            />
          </ProgressBarContainer>
          <ButtonsContainer>
            <IconButton
              icon={<BsCheckCircle />}
              tooltip="Check"
              disabled={!buttonsEnabled}
            />
            <IconButton
              icon={<BsPlayCircle />}
              tooltip="Start"
              disabled={!buttonsEnabled}
              onClick={async () => {
                await controller?.sendZeroCoordinates();
                const writer = appContainer.get<GCodeFileWriter>(
                  TYPES.GCodeFileWriter
                );
                handler?.setWriter(writer);
                writer.startWriting(lines);
              }}
            />
          </ButtonsContainer>
        </ColumnContainer>
      </Card.Body>
      <JobStatusNotification />
    </StyledCard>
  );
};
