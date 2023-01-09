import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import {
  AiOutlineCheckCircle,
  AiOutlineExclamationCircle,
  AiOutlineFrown,
} from "react-icons/ai";
import styled from "styled-components";

type MessageBoxType = "Info" | "Warning" | "Error";

interface CloseHandler {
  (): void;
}

interface MessageBoxProps {
  type: MessageBoxType;
  title: string;
  text: string;
  show: boolean;
  onClose: CloseHandler;
}

const IconBox = styled.span`
  padding-right: 1rem;
  > * {
    color: ${(props) => props.color};
    font-size: 32pt;
  }
`;

interface IconProps {
  type: MessageBoxType;
}

const Icon = (props: IconProps) => {
  switch (props.type) {
    case "Info":
      return (
        <IconBox color="green">
          <AiOutlineCheckCircle />
        </IconBox>
      );
    case "Warning":
      return (
        <IconBox color="orange">
          <AiOutlineExclamationCircle />
        </IconBox>
      );
    case "Error":
      return (
        <IconBox color="red">
          <AiOutlineFrown />
        </IconBox>
      );
  }
};

export const MessageBox = (props: MessageBoxProps) => {
  return (
    <Modal centered show={props.show}>
      <Modal.Header closeButton>
        <Modal.Title>{props.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Icon type={props.type} />
        {props.text}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};
