import { FC, ReactNode } from "react";
import styled, { css } from "styled-components";

import Foldable from "../../../../../components/Foldable";
import IDL from "./IDL";
import ProgramBinary from "./ProgramBinary";
import ProgramCredentials from "./ProgramCredentials";

const ProgramSettings = () => (
  <Wrapper>
    <ProgramSetting
      title="Program ID"
      text="Import/export program keypair or input a public key for the program."
      InsideEl={<ProgramCredentials />}
    />
    <ProgramSetting
      title="Program binary"
      text="Import your program and deploy without failure."
      InsideEl={<ProgramBinary />}
    />
    <ProgramSetting
      title="IDL"
      text="Anchor IDL interactions."
      InsideEl={<IDL />}
    />
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.default.border};
`;

interface ProgramSettingProps {
  title: string;
  text: string;
  InsideEl: ReactNode;
}

const ProgramSetting: FC<ProgramSettingProps> = ({ title, text, InsideEl }) => (
  <ProgramSettingWrapper>
    <Foldable ClickEl={<ProgramSettingTitle>{title}</ProgramSettingTitle>}>
      <ProgramSettingText>{text}</ProgramSettingText>
      {InsideEl}
    </Foldable>
  </ProgramSettingWrapper>
);

const ProgramSettingWrapper = styled.div`
  margin-top: 1rem;
  margin-left: 0.5rem;

  /* Button Wrapper */
  & > div:nth-child(3) {
    margin-top: 0.75rem;
  }
`;

const ProgramSettingTitle = styled.span``;

const ProgramSettingText = styled.div`
  ${({ theme }) => css`
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font.code.size.small};
  `}
`;

export default ProgramSettings;
