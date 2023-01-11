import styled from "styled-components";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import { VscCircleFilled } from "react-icons/vsc";
import { useDispatch, useSelector } from "react-redux";
import { ServiceDiscoverySelectors, ServiceDiscoveryActions } from "@app/store";
import { IconButton } from "./icon-button.component";
import { TfiReload } from "react-icons/tfi";

const { selectConnectivityState, canSelectCNC, selectDiscoveredServices } =
  ServiceDiscoverySelectors;

const { reconnect, connectTo } = ServiceDiscoveryActions;

const StyledCard = styled(Card)`
  margin-top: 0.5rem;
`;

const ColWithOffset = styled(Col)`
  justify-content: center;
`;

const StyledContainer = styled(Row)`
  align-items: center;
  justify-items: center;
`;

const StyledIconButton = styled(IconButton)`
  margin: 0rem;
`;

const StyledReconnectCol = styled(Col)`
  padding: 0rem;
`;

export const ConnectivityWidget = () => {
  const state = useSelector(selectConnectivityState);
  const canSelect = useSelector(canSelectCNC);
  const discoveredItems = useSelector(selectDiscoveredServices);
  const dispatch = useDispatch();
  return (
    <StyledCard>
      <Card.Body>
        <Card.Title>Connection</Card.Title>
        <Container>
          <StyledContainer>
            <ColWithOffset sm="1">
              {state === "searching" && (
                <Spinner animation="border" size="sm" />
              )}
              {state === "connecting" && <VscCircleFilled color="gray" />}
              {state === "connected" && <VscCircleFilled color="green" />}
              {state === "disconnected" && <VscCircleFilled color="red" />}
            </ColWithOffset>
            <Col sm="10">
              <Form.Select
                aria-label="Select CNC to work with"
                disabled={!canSelect}
                onChange={(e) => {
                  const serviceInfo = discoveredItems.find(
                    (item) => `${item.host}:${item.port}` === e.target.value
                  );
                  if (serviceInfo) {
                    dispatch(connectTo(serviceInfo));
                  }
                }}
              >
                {discoveredItems.length === 0 && (
                  <option>Searching for CNC...</option>
                )}
                {discoveredItems.map((item) => (
                  <option
                    key={`${item.host}:${item.port}`}
                    value={`${item.host}:${item.port}`}
                  >{`${item.name} (${item.host}:${item.port})`}</option>
                ))}
              </Form.Select>
            </Col>
            <StyledReconnectCol sm="1">
              <StyledIconButton
                icon={<TfiReload />}
                tooltip="Reconnect"
                size="sm"
                onClick={() => {
                  dispatch(reconnect());
                }}
              />
            </StyledReconnectCol>
          </StyledContainer>
        </Container>
      </Card.Body>
    </StyledCard>
  );
};
