import styled from "styled-components";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import { MachineStateSelectors } from "@app/store";
import { useSelector } from "react-redux";
import { MachineStatus } from "@app/store/types";
import React, { useState } from "react";
import { IconButton } from "./icon-button.component";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

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

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusInline = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 500;
  line-height: 1;
  
  & svg {
    width: 1em;
    height: 1em;
    vertical-align: middle;
    transform: translateY(-0.06em);
  }

  & span {
    line-height: 1;
    display: inline-block;
    transform: translateY(-0.2em);
  }
`;

interface CoordinateViewProps {
  x: number;
  y: number;
  z: number;
}

const BoxWithBorder = styled.div`
  border-style: solid;
  border-width: 1px;
  border-color: var(--theme-border);
  background-color: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
  padding: 0.2rem 0.4rem;
  max-width: 90px;
  max-height: 32px;
  text-align: center;
  font-size: 0.9rem;
`;

const CenteredContainer = styled(Container)`
  text-align: center;
`;
const PaddedContainer = styled(Container)`
  padding-bottom: 0.5rem;
  padding-top: 0.5rem;
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
  const [collapsed, setCollapsed] = useState(false);
  const workPos = useSelector(selectWorkPos);
  const machinePos = useSelector(selectMachinePos);
  const status = useSelector(selectStatus);
  return (
    <StyledCard>
      <Card.Body>
        <Header>
          <HeaderLeft>
            <Card.Title>Machine state</Card.Title>
            {collapsed && (
              <StatusInline>
                {machineStatusToIconMap[status]} <span>{status}</span>
              </StatusInline>
            )}
          </HeaderLeft>
          <IconButton
            icon={collapsed ? <FiChevronDown /> : <FiChevronUp />}
            tooltip={collapsed ? "Expand" : "Collapse"}
            size="sm"
            onClick={() => setCollapsed((v) => !v)}
          />
        </Header>
        {collapsed ? null : (
          <>
            <Card.Subtitle className="mb-1 text-muted">
              Work coordinates
            </Card.Subtitle>
            <PaddedContainer>
              <CoordinateView x={workPos.x} y={workPos.y} z={workPos.z} />
            </PaddedContainer>
            <Card.Subtitle className="mb-1 text-muted">
              Machine coordinates
            </Card.Subtitle>
            <PaddedContainer>
              <CoordinateView x={machinePos.x} y={machinePos.y} z={machinePos.z} />
            </PaddedContainer>
            <Card.Subtitle className="mb-1 text-muted">Status</Card.Subtitle>
            <Card.Text>
              {machineStatusToIconMap[status]} {status}
            </Card.Text>
          </>
        )}
      </Card.Body>
    </StyledCard>
  );
};
