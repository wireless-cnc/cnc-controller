import Button, { ButtonProps } from "react-bootstrap/Button";
import styled from "styled-components";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

type IconButtonProps = ButtonProps & {
  icon: React.ReactNode;
  tooltip: string;
};

const StyledButton = styled(Button)`
  margin: 0.5rem;
`;

const renderTooltip = (disabled: boolean, text: string) => {
  if (disabled) {
    return <></>;
  } else {
    return <Tooltip>{text}</Tooltip>;
  }
};

export const IconButton = (props: IconButtonProps) => {
  return (
    <>
      <OverlayTrigger
        placement="bottom"
        overlay={renderTooltip(props.disabled!!, props.tooltip)}
      >
        <StyledButton variant="outline-primary" size="lg" {...props}>
          {props.icon}
        </StyledButton>
      </OverlayTrigger>
    </>
  );
};
