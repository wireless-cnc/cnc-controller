import { useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import { useSelector } from "react-redux";
import { ControllerContext } from "@app/context";
import { MachineStateSelectors } from "@app/store";
import { StyledCardBody, StyledCardTitle } from "./styled-card-body.component";
import { Header, HeaderLeft } from "./card-header.component";
import { GiCircularSaw } from "react-icons/gi";
import { FiPower } from "react-icons/fi";

const StyledCard = styled(Card)`
  margin-top: 0.5rem;
`;

const SpeedRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const SpeedValue = styled.span`
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.04em;
`;

const SpeedLabel = styled.span`
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--theme-text-secondary);
`;

const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px min-content;
  gap: 0.75rem;
  align-items: center;
`;

const StyledRange = styled(Form.Range)`
  width: 100%;
  accent-color: var(--bs-primary);
  appearance: none;
  height: 6px;
  border-radius: 999px;
  background-color: var(--theme-border);

  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--bs-primary);
    border: 2px solid var(--theme-bg-primary, #111);
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--bs-primary);
    border: 2px solid var(--theme-bg-primary, #111);
    cursor: pointer;
  }
`;

const NumericInput = styled(Form.Control)`
  width: 110px;
  text-align: right;
`;

const StartStopButton = styled(Button)`
  min-width: 110px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusBadge = styled(Badge)`
  display: inline-flex;
  align-items: center;
  height: 1.25rem;
  padding: 0 0.6rem;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  margin-top: -0.5rem;
`;

const MIN_RPM = 0;
const MAX_RPM = 12000;
const RPM_STEP = 100;
const DEFAULT_RPM = 6000;

const clampRpm = (value: number) => {
  return Math.max(MIN_RPM, Math.min(MAX_RPM, value));
};

const quantizeRpm = (value: number) => {
  return Math.round(value / RPM_STEP) * RPM_STEP;
};

export const SpindleControlWidget = () => {
  const controller = useContext(ControllerContext);
  const machineStatus = useSelector(MachineStateSelectors.selectStatus);
  const [rpm, setRpm] = useState(DEFAULT_RPM);
  const [running, setRunning] = useState(false);
  const [lastSyncedRpm, setLastSyncedRpm] = useState(DEFAULT_RPM);

  const sliderFill = useMemo(() => {
    return ((rpm - MIN_RPM) / (MAX_RPM - MIN_RPM)) * 100;
  }, [rpm]);

  const canControl = useMemo(() => {
    return Boolean(controller) && machineStatus !== "Disconnected";
  }, [controller, machineStatus]);

  useEffect(() => {
    if (machineStatus === "Disconnected" || machineStatus === "Alarm") {
      setRunning(false);
    }
  }, [machineStatus]);

  useEffect(() => {
    if (!canControl || rpm === lastSyncedRpm || !controller) {
      return;
    }
    const timer = window.setTimeout(() => {
      controller.sendGCode(`S${rpm}`);
      setLastSyncedRpm(rpm);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [rpm, canControl, lastSyncedRpm, controller]);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = quantizeRpm(parseInt(event.target.value, 10));
    setRpm(clampRpm(next));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = parseInt(event.target.value, 10);
    if (Number.isNaN(numeric)) {
      setRpm(MIN_RPM);
    } else {
      setRpm(clampRpm(numeric));
    }
  };

  const handleStartStop = () => {
    if (!canControl || !controller) {
      return;
    }
    if (running) {
      controller.sendGCode("M5");
      setRunning(false);
    } else {
      controller.sendGCode(`M3 S${rpm}`);
      setRunning(true);
      setLastSyncedRpm(rpm);
    }
  };

  const startStopTooltip = running ? "Stop spindle" : "Start spindle";

  return (
    <StyledCard>
      <StyledCardBody>
        <Header>
          <HeaderLeft>
            <StatusRow>
              <StyledCardTitle>Spindle</StyledCardTitle>
              <StatusBadge bg={running ? "success" : "secondary"}>
                {running ? "Running" : "Idle"}
              </StatusBadge>
            </StatusRow>
          </HeaderLeft>
        </Header>
        <ControlsGrid>
          <StyledRange
            min={MIN_RPM}
            max={MAX_RPM}
            step={RPM_STEP}
            value={rpm}
            disabled={!canControl}
            onChange={handleSliderChange}
            style={{
              background: `linear-gradient(90deg, var(--bs-primary) ${sliderFill}%, var(--theme-border) ${sliderFill}%)`,
            }}
            aria-label="Spindle speed"
          />
          <InputGroup size="sm">
            <NumericInput
              type="number"
              min={MIN_RPM}
              max={MAX_RPM}
              step={RPM_STEP}
              value={rpm}
              disabled={!canControl}
              onChange={handleInputChange}
              aria-label="Spindle speed value"
            />
            <InputGroup.Text>RPM</InputGroup.Text>
          </InputGroup>
          <StartStopButton
            variant={running ? "outline-danger" : "outline-primary"}
            size="sm"
            disabled={!canControl}
            onClick={handleStartStop}
            title={startStopTooltip}
          >
            {running ? (
              <>
                <FiPower style={{ marginRight: 6 }} /> Stop
              </>
            ) : (
              <>
                <GiCircularSaw style={{ marginRight: 6 }} /> Start
              </>
            )}
          </StartStopButton>
        </ControlsGrid>
      </StyledCardBody>
    </StyledCard>
  );
};
