import styled from "styled-components";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import { StyledCardBody, StyledCardTitle } from "./styled-card-body.component";
import { VscCircleFilled } from "react-icons/vsc";
import { useDispatch, useSelector } from "react-redux";
import { ServiceDiscoverySelectors, ServiceDiscoveryActions } from "@app/store";
import { IconButton } from "./icon-button.component";
import { TfiReload } from "react-icons/tfi";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { usePanelCollapse } from "@app/hooks/usePanelCollapse";

const {
  selectConnectivityState,
  canSelectCNC,
  selectDiscoveredServices,
  selectActiveService,
} = ServiceDiscoverySelectors;

const { reconnect, connectTo } = ServiceDiscoveryActions;

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
    width: 0.9em;
    height: 0.9em;
    vertical-align: middle;
    transform: translateY(-0.05em);
  }

  & span {
    display: inline-block;
    line-height: 1;
    transform: translateY(-0.05em);
  }
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
  const { collapsed, toggle } = usePanelCollapse("connectivity");
  const state = useSelector(selectConnectivityState);
  const canSelect = useSelector(canSelectCNC);
  const discoveredItems = useSelector(selectDiscoveredServices);
  const activeService = useSelector(selectActiveService);
  const dispatch = useDispatch();

  const statusIcon = () => {
    if (state === "searching") return <Spinner animation="border" size="sm" />;
    if (state === "connecting") return <VscCircleFilled color="gray" />;
    if (state === "connected") return <VscCircleFilled color="green" />;
    return <VscCircleFilled color="red" />;
  };

  const toggleIcon = collapsed ? <FiChevronDown /> : <FiChevronUp />;
  const activeLabel = activeService
    ? `${activeService.name}`
    : "Not connected";
  return (
    <StyledCard>
      <StyledCardBody>
        <Header>
          <HeaderLeft>
            {!collapsed && <StyledCardTitle>Connection</StyledCardTitle>}
            {collapsed && (
              <StatusInline>
                {statusIcon()}
                <span>{activeLabel}</span>
              </StatusInline>
            )}
          </HeaderLeft>
          <IconButton
            icon={toggleIcon}
            tooltip={collapsed ? "Expand" : "Collapse"}
            size="sm"
            onClick={toggle}
          />
        </Header>

        {collapsed ? null : (
          <Container>
            <StyledContainer>
              <ColWithOffset sm="1">{statusIcon()}</ColWithOffset>
              <Col sm="10">
                <Form.Select
                  aria-label="Select CNC to work with"
                  disabled={!canSelect}
                  value={activeService ? `${activeService.host}:${activeService.port}` : undefined}
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
        )}
      </StyledCardBody>
    </StyledCard>
  );
};
