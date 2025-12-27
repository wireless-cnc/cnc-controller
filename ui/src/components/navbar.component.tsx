import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { ThemeSelectors, ThemeActions } from "../store";
import { BsSun, BsMoon } from "react-icons/bs";

const StyledContainer = styled(Container)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ThemeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.5rem;
  color: var(--theme-text-primary);
  transition: color 0.3s ease;

  &:hover {
    color: var(--theme-text-secondary);
  }
`;

export const AppNavbar = () => {
  const dispatch = useDispatch();
  const theme = useSelector(ThemeSelectors.selectThemeMode);

  const handleToggleTheme = () => {
    dispatch(ThemeActions.toggleTheme());
  };

  return (
    <Navbar
      variant={theme === "dark" ? "dark" : "light"}
      bg={theme === "dark" ? "dark" : "light"}
      expanded
      style={{
        backgroundColor: "var(--theme-bg-secondary)",
        borderBottom: "1px solid var(--theme-border)",
      }}
    >
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
        <ThemeButton onClick={handleToggleTheme} title="Toggle theme">
          {theme === "dark" ? <BsSun /> : <BsMoon />}
        </ThemeButton>
      </StyledContainer>
    </Navbar>
  );
};
