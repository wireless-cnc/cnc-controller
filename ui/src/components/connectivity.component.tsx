import styled from "styled-components";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import { VscCircleFilled } from "react-icons/vsc";
import { useSelector } from "react-redux";
import { ServiceDiscoverySelectors } from "@app/store";

const { selectConnectivityState, canSelectCNC, selectDiscoveredServices } =
  ServiceDiscoverySelectors;

const StyledCard = styled(Card)`
  margin-top: 0.5rem;
`;

const ColWithOffset = styled(Col)`
  padding-top: 0.25rem;
`;

export const ConnectivityWidget = () => {
  const state = useSelector(selectConnectivityState);
  const canSelect = useSelector(canSelectCNC);
  const discoveredItems = useSelector(selectDiscoveredServices);
  return (
    <StyledCard>
      <Card.Body>
        <Card.Title>Connection</Card.Title>
        <Container>
          <Row>
            <ColWithOffset sm="1">
              {state === "searching" && (
                <Spinner animation="border" size="sm" />
              )}
              {state === "connecting" && <VscCircleFilled color="gray" />}
              {state === "connected" && <VscCircleFilled color="green" />}
              {state === "disconnected" && <VscCircleFilled color="red" />}
            </ColWithOffset>
            <Col>
              <Form.Select
                aria-label="Select CNC to work with"
                disabled={!canSelect}
                onChange={(e) => {
                  console.log(e);
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
          </Row>
        </Container>
      </Card.Body>
    </StyledCard>
  );
};
