import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import "./css/styles.css";

import { AppNavbar } from "./components/navbar.component";
import { MachineStateWidget } from "./components/machine-state.component";
import { JobCardWidget } from "./components/job-card.component";
import { ControlsWidget } from "./components/controls.component";
import { ConnectivityWidget } from "./components/connectivity.component";

export const App = () => {
  return (
    <>
      {!window.electron && <AppNavbar />}
      <Container className="main">
        <Row>
          <Col>
            <JobCardWidget />
          </Col>
          <Col lg={5}>
            <Container>
              <Row>
                <Col>
                  <ConnectivityWidget />
                </Col>
              </Row>
              <Row>
                <Col>
                  <MachineStateWidget />
                </Col>
              </Row>
              <Row>
                <Col>
                  <ControlsWidget />
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </>
  );
};
