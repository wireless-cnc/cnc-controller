import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import styled from "styled-components";

const StyledContainer = styled(Container)`
  display: flex;
  justify-content: space-between;
`;

export const AppNavbar = () => {
  return (
    <Navbar variant="light" bg="light" expanded>
      <StyledContainer fluid>
        <Container fluid>
          <img
            src="milling-machine.png"
            className="d-inline-block align-top"
            width={24}
            height={24}
          ></img>{" "}
          CNC Controller
        </Container>
      </StyledContainer>
    </Navbar>
  );
};
