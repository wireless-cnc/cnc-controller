import styled from "styled-components";

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const StatusInline = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 500;
  line-height: 1;
  
  & svg {
    width: 1em;
    height: 1em;
    vertical-align: middle;
    transform: translateY(-0.06em);
  }

  & span {
    line-height: 1;
    display: inline-block;
    transform: translateY(-0.2em);
  }
`;
