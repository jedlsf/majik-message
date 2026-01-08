import styled from "styled-components";
import { useEffect, useRef, useState } from "react";

import DuoButton from "./foundations/DuoButton";
import CustomInputField from "./foundations/CustomInputField";
import { MajikMessage } from "../SDK/majik-message/majik-message";
import { TitleHeader } from "../globals/styled-components";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.semitransparent};
  backdrop-filter: blur(5px); /* Soft blur effect */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Panel = styled.div`
  background: ${({ theme }) => theme.colors.primaryBackground};
  color: ${({ theme }) => theme.colors.textPrimary};
  backdrop-filter: blur(50px);
  border-radius: ${({ theme }) => theme.borders.radius.large};
  padding: 2.5em;
  gap: 15px;
  width: 350px;
  max-width: 90vw;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid transparent;
  justify-content: center;
  align-items: center;
  display: flex;
  flex-direction: column;
  box-sizing: unset;

  p {
    font-size: ${({ theme }) => theme.typography.sizes.label};
    line-height: 1.5;
    font-weight: 400;
    padding: 10px;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

interface UnlockModalProps {
  majik?: MajikMessage | null;
  identityId: string | null;
  onCancel: () => void;
  onSubmit: (passphrase: string) => void;
}

// ======== Main Component ========

const UnlockModal: React.FC<UnlockModalProps> = ({
  majik,
  identityId,
  onCancel,
  onSubmit,
}) => {
  const [pass, setPass] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // prevents multiple auto-unlocks
  const hasUnlockedRef = useRef(false);

  useEffect(() => {
    if (!majik || !identityId) return;

    const trimmed = pass.trim();

    // reset state when empty
    if (!trimmed) {
      setIsValid(false);
      setIsChecking(false);
      return;
    }

    let cancelled = false;
    setIsChecking(true);

    // small debounce to avoid crypto spam
    const timeout = setTimeout(async () => {
      try {
        const ok = await majik.isPassphraseValid(trimmed, identityId);
        if (!cancelled) setIsValid(ok);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [pass, majik, identityId]);

  // AUTO-UNLOCK when valid
  useEffect(() => {
    if (!isValid || hasUnlockedRef.current) return;

    hasUnlockedRef.current = true;
    onSubmit(pass.trim());
  }, [isValid, pass, onSubmit]);

  if (!identityId) return null;

  return (
    <Overlay>
      <Panel>
        <TitleHeader>Unlock Identity</TitleHeader>
        <p>
          Enter passphrase for <strong>
            {!!majik
              ? majik.getContactByID(identityId)?.meta?.label || identityId
              : identityId}
          </strong>
        </p>
        <CustomInputField
          label="Enter Password"
          onChange={(value) => {
            hasUnlockedRef.current = false; // reset if user edits
            setPass(value);
          }}
          type={"password"}
          passwordType="NONE"
        />

        <DuoButton
          textButtonA="Cancel"
          textButtonB={isChecking ? "Checking…" : "Unlock"}
          onClickButtonA={onCancel}
          onClickButtonB={() => onSubmit(pass.trim())}
          isDisabledButtonB={!pass.trim() || !isValid}
        />
      </Panel>
    </Overlay>
  );
};

export default UnlockModal;
