import { useState } from "react";
import styled from "styled-components";

import Button from "../../../../../components/Button";
import CopyButton from "../../../../../components/CopyButton";
import Input from "../../../../../components/Input";
import Link from "../../../../../components/Link";
import Modal, { useModal } from "../../../../../components/Modal";
import Text from "../../../../../components/Text";
import { Checkmark, Sad } from "../../../../../components/Icons";
import { CLIENT_URL } from "../../../../../constants";
import { PgCommon, PgShare } from "../../../../../utils/pg";
import { useKeybind } from "../../../../../hooks";

interface TextState {
  kind?: "success" | "error";
  id?: string;
}

export const Share = () => {
  const [textState, setTextState] = useState<TextState>({});
  const [loading, setLoading] = useState(false);

  const share = async () => {
    setLoading(true);

    try {
      const id = await PgCommon.transition(PgShare.new());
      setTextState({ kind: "success", id });
    } catch (e: any) {
      console.log("SHARE ERROR:", e.message);
      setTextState({ kind: "error" });
    } finally {
      setLoading(false);
    }
  };

  const { close } = useModal();

  useKeybind("Enter", () => {
    if (textState.id) close();
    else share();
  });

  const shareLink = `${CLIENT_URL}/${textState.id}`;

  return (
    <Modal title>
      <Content>
        {textState.kind ? (
          textState.kind === "error" ? (
            <Text kind={textState.kind} IconEl={<Sad />}>
              You are sharing too often, please try again later.
            </Text>
          ) : (
            <Text kind={textState.kind} IconEl={<Checkmark color="success" />}>
              Successfully shared the project.
            </Text>
          )
        ) : (
          <Text>Do you want to share this project?</Text>
        )}
      </Content>

      {textState.id ? (
        <>
          <SuccessWrapper>
            <InputWrapper>
              <Input value={shareLink} readOnly />
              <CopyButton copyText={shareLink} />
            </InputWrapper>
            <LinkWrapper>
              <Link href={shareLink}>Go to the link</Link>
            </LinkWrapper>
          </SuccessWrapper>

          <ButtonWrapper>
            <Button onClick={close}>Continue</Button>
          </ButtonWrapper>
        </>
      ) : (
        <ButtonWrapper>
          <Button onClick={close} kind="transparent">
            Cancel
          </Button>
          <Button
            onClick={share}
            disabled={loading}
            btnLoading={loading}
            kind="primary-transparent"
          >
            {loading ? "Sharing..." : "Share"}
          </Button>
        </ButtonWrapper>
      )}
    </Modal>
  );
};

const Content = styled.div``;

const SuccessWrapper = styled.div``;

const InputWrapper = styled.div`
  display: flex;
  margin-top: 1rem;
  min-width: 20rem;
`;

const LinkWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 0.75rem;
  margin-left: 0.25rem;

  & a,
  & svg {
    color: ${({ theme }) => theme.colors.state.info.color};
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;

  & button:nth-child(2) {
    margin-left: 1rem;
  }
`;
