import { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import { StyledCardBody, StyledCardTitle } from "./styled-card-body.component";
import { useSelector } from "react-redux";
import { MachineStateSelectors } from "@app/store";
import { ControllerContext } from "@app/context";
import {
  BsArrowUp,
  BsArrowDown,
  BsArrowLeft,
  BsArrowRight,
  BsArrowUpShort,
  BsArrowDownShort,
} from "react-icons/bs";
import { MdOutlineDoNotDisturbOn } from "react-icons/md";
import { IconButton } from "./icon-button.component";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { usePanelCollapse } from "@app/hooks/usePanelCollapse";
import { userPreferencesStorage } from "@app/store/userPreferencesStorage";

const StyledCard = styled(Card)`
  margin-top: 0.5rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const JogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 60px);
  grid-template-rows: repeat(3, 60px);
  gap: 6px;
  justify-content: center;
  margin: 12px auto;
`;

const JogButton = styled.button<{ $gridArea: string }>`
  grid-area: ${(props) => props.$gridArea};
  border: 2px solid ${(props) => props.theme.mode === "dark" ? "#555" : "#ccc"};
  border-radius: 6px;
  background: ${(props) => props.theme.mode === "dark" ? "#333" : "#f0f0f0"};
  color: ${(props) => props.theme.mode === "dark" ? "#fff" : "#000"};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${(props) => props.theme.mode === "dark" ? "#444" : "#e0e0e0"};
    border-color: #007bff;
  }

  &:active:not(:disabled) {
    background: ${(props) => props.theme.mode === "dark" ? "#555" : "#d0d0d0"};
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0;
`;

const ControlLabel = styled.label`
  font-weight: 500;
  margin-right: 10px;
  min-width: 60px;
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
`;

const StyledSelect = styled(Form.Select)`
  width: 90px;
`;

const StyledRange = styled(Form.Range)`
  flex: 1;
`;

const STEP_OPTIONS = [0.1, 0.5, 1, 5, 10, 50, 100];
const FEED_OPTIONS = [50, 100, 200, 500, 1000, 2000, 5000];
const DEFAULT_STEP = 1;
const DEFAULT_FEED = 100;

const sanitizeStep = (value: number) =>
  STEP_OPTIONS.includes(value) ? value : DEFAULT_STEP;

const sanitizeFeed = (value: number) =>
  FEED_OPTIONS.includes(value) ? value : DEFAULT_FEED;

export const JogWidget = () => {
  const { collapsed, toggle } = usePanelCollapse("jog");
  const [step, setStep] = useState(() =>
    sanitizeStep(userPreferencesStorage.getJogStep(DEFAULT_STEP))
  );
  const [feed, setFeed] = useState(() =>
    sanitizeFeed(userPreferencesStorage.getJogFeed(DEFAULT_FEED))
  );
  const [keyboardControl, setKeyboardControl] = useState(() =>
    userPreferencesStorage.getJogKeyboardControl(false)
  );
  const controller = useContext(ControllerContext);
  const machineStatus = useSelector(MachineStateSelectors.selectStatus);

  // Jogging is only allowed in Idle or Jog states according to GRBL spec
  const canJog = machineStatus === "Idle" || machineStatus === "Jog";

  const handleJog = (x?: number, y?: number, z?: number) => {
    if (!canJog || !controller) return;
    
    const xMove = x !== undefined ? x * step : undefined;
    const yMove = y !== undefined ? y * step : undefined;
    const zMove = z !== undefined ? z * step : undefined;
    
    controller.sendJog(xMove, yMove, zMove, feed);
  };

  // Keyboard control
  useEffect(() => {
    if (!keyboardControl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for arrow keys to avoid scrolling
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown"].includes(e.key)) {
        e.preventDefault();
      }

      if (!canJog) return;

      switch (e.key) {
        case "ArrowLeft":
          handleJog(-1, 0, 0);
          break;
        case "ArrowRight":
          handleJog(1, 0, 0);
          break;
        case "ArrowUp":
          handleJog(0, 1, 0);
          break;
        case "ArrowDown":
          handleJog(0, -1, 0);
          break;
        case "PageUp":
          handleJog(0, 0, 1);
          break;
        case "PageDown":
          handleJog(0, 0, -1);
          break;
        case "Escape":
          controller?.sendJogCancel();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [keyboardControl, canJog, step, feed]);

  const applyStepValue = (value: number) => {
    const sanitized = sanitizeStep(value);
    setStep(sanitized);
    userPreferencesStorage.setJogStep(sanitized);
  };

  const applyFeedValue = (value: number) => {
    const sanitized = sanitizeFeed(value);
    setFeed(sanitized);
    userPreferencesStorage.setJogFeed(sanitized);
  };

  const applyKeyboardControl = (value: boolean) => {
    setKeyboardControl(value);
    userPreferencesStorage.setJogKeyboardControl(value);
  };

  return (
    <StyledCard>
      <StyledCardBody>
        <Header>
          <StyledCardTitle>Jog</StyledCardTitle>
          <IconButton
            icon={collapsed ? <FiChevronDown /> : <FiChevronUp />}
            tooltip={collapsed ? "Expand" : "Collapse"}
            size="sm"
            onClick={toggle}
          />
        </Header>

        {collapsed ? null : (
          <>
            <JogGrid>
              <div style={{ gridColumn: "1 / 2", gridRow: "1 / 2" }} />
              <JogButton
                $gridArea="1 / 2 / 2 / 3"
                onClick={() => handleJog(0, 1, 0)}
                disabled={!canJog}
                title="Y+"
              >
                <BsArrowUp />
              </JogButton>
              <JogButton
                $gridArea="1 / 3 / 2 / 4"
                onClick={() => handleJog(0, 0, 1)}
                disabled={!canJog}
                title="Z+"
              >
                <BsArrowUpShort />
              </JogButton>

              <JogButton
                $gridArea="2 / 1 / 3 / 2"
                onClick={() => handleJog(-1, 0, 0)}
                disabled={!canJog}
                title="X-"
              >
                <BsArrowLeft />
              </JogButton>
              <JogButton
                $gridArea="2 / 2 / 3 / 3"
                onClick={() => controller?.sendJogCancel()}
                disabled={!canJog}
                title="Stop Jog"
              >
                <MdOutlineDoNotDisturbOn />
              </JogButton>
              <JogButton
                $gridArea="2 / 3 / 3 / 4"
                onClick={() => handleJog(1, 0, 0)}
                disabled={!canJog}
                title="X+"
              >
                <BsArrowRight />
              </JogButton>

              <div style={{ gridColumn: "1 / 2", gridRow: "3 / 4" }} />
              <JogButton
                $gridArea="3 / 2 / 4 / 3"
                onClick={() => handleJog(0, -1, 0)}
                disabled={!canJog}
                title="Y-"
              >
                <BsArrowDown />
              </JogButton>
              <JogButton
                $gridArea="3 / 3 / 4 / 4"
                onClick={() => handleJog(0, 0, -1)}
                disabled={!canJog}
                title="Z-"
              >
                <BsArrowDownShort />
              </JogButton>
            </JogGrid>

            <ControlRow>
              <ControlLabel>Step:</ControlLabel>
              <ControlGroup>
                <StyledSelect
                  value={step}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    applyStepValue(parseFloat(e.target.value))
                  }
                >
                  {STEP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </StyledSelect>
                <StyledRange
                  min={0}
                  max={STEP_OPTIONS.length - 1}
                  value={STEP_OPTIONS.indexOf(step)}
                  onChange={(e) => {
                    const index = parseInt(e.target.value, 10);
                    const option = STEP_OPTIONS[index] ?? DEFAULT_STEP;
                    applyStepValue(option);
                  }}
                />
              </ControlGroup>
            </ControlRow>

            <ControlRow>
              <ControlLabel>Feed:</ControlLabel>
              <ControlGroup>
                <StyledSelect
                  value={feed}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    applyFeedValue(parseInt(e.target.value, 10))
                  }
                >
                  {FEED_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </StyledSelect>
                <StyledRange
                  min={0}
                  max={FEED_OPTIONS.length - 1}
                  value={FEED_OPTIONS.indexOf(feed)}
                  onChange={(e) => {
                    const index = parseInt(e.target.value, 10);
                    const option = FEED_OPTIONS[index] ?? DEFAULT_FEED;
                    applyFeedValue(option);
                  }}
                />
              </ControlGroup>
            </ControlRow>

            <Form.Check
              type="checkbox"
              label="Keyboard control"
              checked={keyboardControl}
              onChange={(e) => applyKeyboardControl(e.target.checked)}
            />
          </>
        )}
      </StyledCardBody>
    </StyledCard>
  );
};
