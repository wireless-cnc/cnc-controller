import styled from "styled-components";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import { MachineStateSelectors } from "@app/store";
import { useSelector } from "react-redux";
import { MachineStatus } from "@app/store/types";
import React from "react";

import {
  CiSquareQuestion,
  CiCircleCheck,
  CiPause1,
  CiWarning,
  CiHome,
} from "react-icons/ci";
import { VscDebugDisconnect } from "react-icons/vsc";
import { IoPlayForward } from "react-icons/io5";
import { IoMdMove } from "react-icons/io";

const { selectMachinePos, selectWorkPos, selectStatus } = MachineStateSelectors;

const StyledCard = styled(Card)`
  margin-top: 0.5rem;
`;

interface CoordinateViewProps {
  x: number;
  y: number;
  z: number;
}

const BoxWithBorder = styled.div`
  border-style: solid;
  border-width: 1px;
  border-color: #949393;
  padding: 0.3rem;
  max-width: 100px;
  max-height: 40px;
  text-align: center;
`;

const CenteredContainer = styled(Container)`
  text-align: center;
`;
const PaddedContainer = styled(Container)`
  padding-bottom: 1rem;
`;

const machineStatusToIconMap: Record<MachineStatus, React.ReactNode> = {
  Disconnected: <VscDebugDisconnect />,
  Initial: <CiSquareQuestion />,
  Idle: <CiCircleCheck />,
  Hold: <CiPause1 />,
  Alarm: <CiWarning />,
  Check: <CiWarning />,
  Door: <CiWarning />,
  Home: <CiHome />,
  Jog: <IoMdMove />,
  Run: <IoPlayForward />,
};

const CoordinateView = (props: CoordinateViewProps) => {
  return (
    <CenteredContainer>
      <Row>
        <Col>
          <BoxWithBorder>{props.x.toFixed(3)}</BoxWithBorder>
        </Col>
        <Col>
          <BoxWithBorder>{props.y.toFixed(3)}</BoxWithBorder>
        </Col>
        <Col>
          <BoxWithBorder>{props.z.toFixed(3)}</BoxWithBorder>
        </Col>
      </Row>
    </CenteredContainer>
  );
};

export const MachineStateWidget = () => {
  const workPos = useSelector(selectWorkPos);
  const machinePos = useSelector(selectMachinePos);
  const status = useSelector(selectStatus);
  return (
    <StyledCard>
      <Card.Body>
        <Card.Title>Machine state</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          Work coordinates
        </Card.Subtitle>
        <PaddedContainer>
          <CoordinateView x={workPos.x} y={workPos.y} z={workPos.z} />
        </PaddedContainer>
        <Card.Subtitle className="mb-2 text-muted">
          Machine coordinates
        </Card.Subtitle>
        <PaddedContainer>
          <CoordinateView x={machinePos.x} y={machinePos.y} z={machinePos.z} />
        </PaddedContainer>
        <Card.Subtitle className="mb-2 text-muted">Status</Card.Subtitle>
        <Card.Text>
          {machineStatusToIconMap[status]} {status}
        </Card.Text>
      </Card.Body>
    </StyledCard>
  );
};
