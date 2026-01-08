"use client";

import React, { useEffect, useState } from "react";
import styled, { css } from "styled-components";
import { MajikContact } from "../../SDK/majik-message/core/contacts/majik-contact";
import { isDevEnvironment } from "../../utils/utils";
import DeleteButton from "../foundations/DeleteButton";
import RowTextItem from "../foundations/RowTextItem";
import StyledIconButton from "../foundations/StyledIconButton";
import {
  CheckCircleIcon,
  GearIcon,
  LinkIcon,
  PencilIcon,
  ProhibitIcon,
  StarIcon,
} from "@phosphor-icons/react";
import ConfirmationButton from "../foundations/ConfirmationButton";
import theme from "../../globals/theme";
import PopUpFormButton from "../foundations/PopUpFormButton";
import CustomInputField from "../foundations/CustomInputField";
import { useMajik } from "../../sidepanel/MajikMessageWrapper";
import { toast } from "sonner";

// Styled components
const RootContainer = styled.div<{ $isActive?: boolean }>`
 
  width: inherit;
  border: 1px solid transparent;
  border-radius: 8px;
   display: flex;
 flex-direction: column;
 gap: 5px;

   user-select: none;
  transition: all 0.3s ease;

     @media (hover: hover) and (pointer: fine) {

   &:hover {
        border: 1px solid ${({ theme }) => theme.colors.secondaryBackground};

  }

  ${({ $isActive }) =>
    $isActive &&
    css`
      background-color: ${({ theme }) => theme.colors.accent};
    `}


`;

const BodyContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.secondaryBackground};
  border-radius: 12px;
  display: flex;
  width: 100%;
    padding: 0px;
  transition: all 0.4s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.085);

  @media (hover: hover) and (pointer: fine) {

   &:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.24);
       border-radius: 0px 0px 12px 12px;

  }
`;

const ColumnMain = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  justify-content: left;
  text-align: left;
`;

const ColumnInfo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: left;
  gap: 25px;
  width: 100%;
  padding: 15px;
`;

const ItemTitle = styled.div<{ $blocked?: boolean }>`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme, $blocked }) =>
    $blocked ? theme.colors.error : theme.colors.textPrimary};
`;

const SubColumnContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  margin-bottom: 10px;
`;

const ActionButtonRow = styled.div<{ $enableHover?: boolean }>`
  display: flex;
  flex-direction: row;
  gap: 3px;
  align-items: center;
  justify-content: flex-end;
  transition: all 0.2s ease;
  height: 0px;
  opacity: 0;

  ${({ $enableHover }) =>
    $enableHover &&
    css`
      @media (hover: hover) and (pointer: fine) {
        ${RootContainer}:hover & {
          height: 30px;
          opacity: 1;
          padding: 5px;
          margin: 3px;
        }
      }
    `}
`;

const UserNameRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 3px;
  align-items: center;
  justify-content: flex-start;
  transition: all 0.2s ease;
  margin-bottom: 8px;
`;

interface PassphraseUpdateParams {
  id: string;
  passphrase: { old: string; new: string };
}

interface CBaseUserAccountProps {
  itemData: MajikContact;
  onPressed?: (itemData: MajikContact) => void;
  onEdit?: (data: MajikContact) => void;
  onDelete?: (data: MajikContact) => void;
  onShare?: (data: MajikContact) => void;
  onSetActive?: (data: MajikContact) => void;
  onBlock?: (data: MajikContact) => void;
  onUnBlock?: (data: MajikContact) => void;
  onUpdatePassphrase?: (params: PassphraseUpdateParams) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  index?: number;
}

const CBaseUserAccount: React.FC<CBaseUserAccountProps> = ({
  itemData,
  onPressed,
  onDelete,
  onEdit,
  onShare,
  onSetActive,
  onBlock,
  onUnBlock,
  onUpdatePassphrase,
  canEdit = true,
  canDelete = true,
  index,
}) => {
  const { majik } = useMajik();
  const [passphraseUpdate, setPassphraseUpdate] =
    useState<PassphraseUpdateParams>({
      id: itemData.id,
      passphrase: {
        old: "",
        new: "",
      },
    });

  const [isValid, setIsValid] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!majik || !itemData?.id) return;

    const trimmed = passphraseUpdate?.passphrase?.old?.trim();

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
        const ok = await majik.isPassphraseValid(trimmed, itemData.id);
        if (!cancelled) setIsValid(ok);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [passphraseUpdate?.passphrase?.old, majik, itemData.id]);

  const handleOnPressed = () => {
    if (isDevEnvironment())
      console.log("MajikContact Item Pressed from Base: ", itemData);

    if (!itemData) return;
    if (onPressed) onPressed(itemData);
  };

  const handleSubmitPassphraseUpdate = () => {
    if (!itemData) return;

    if (passphraseUpdate.passphrase.old === passphraseUpdate.passphrase.new) {
      toast.error("Invalid Password", {
        description: "New password must not be the same as the old password.",
      });
      resetSubmission();
      return;
    }

    if (isDevEnvironment()) console.log("Submitting: ", passphraseUpdate);

    onUpdatePassphrase?.(passphraseUpdate);

    if (isDevEnvironment()) console.log("Passphrase Update Submitted");
  };

  const resetSubmission = () => {
    if (isDevEnvironment()) console.log("Resetting State");
    setPassphraseUpdate({
      id: itemData.id,
      passphrase: {
        old: "",
        new: "",
      },
    });
  };

  return (
    <RootContainer onClick={handleOnPressed} $isActive={index === 0}>
      <ActionButtonRow
        $enableHover={(!!onDelete && canDelete) || (!!onEdit && canEdit)}
      >
        {!!onSetActive &&
        onSetActive !== undefined &&
        !!onSetActive &&
        !!index &&
        index !== 0 ? (
          <StyledIconButton
            icon={StarIcon}
            title="Set as Active"
            onClick={() => onSetActive?.(itemData)}
            size={24}
          />
        ) : null}
        {!!onEdit && onEdit !== undefined && !!onEdit ? (
          <StyledIconButton
            icon={PencilIcon}
            title="Edit"
            onClick={() => onEdit?.(itemData)}
            size={24}
          />
        ) : null}
        {!!onUpdatePassphrase &&
        onUpdatePassphrase !== undefined &&
        !!onUpdatePassphrase ? (
          <PopUpFormButton
            icon={GearIcon}
            text="Change Passphrase"
            alertTextTitle="Change Passphrase"
            onClick={handleSubmitPassphraseUpdate}
            isDisabledButtonB={
              !passphraseUpdate?.id?.trim() ||
              !isValid ||
              !passphraseUpdate?.passphrase?.old?.trim() ||
              !passphraseUpdate?.passphrase?.new?.trim()
            }
          >
            <CustomInputField
              label="Enter Old Password"
              onChange={(value) => {
                setPassphraseUpdate((prev) => ({
                  ...prev,
                  passphrase: {
                    ...prev.passphrase,
                    old: value,
                  },
                }));
              }}
              type={"password"}
              passwordType="NONE"
              currentValue={passphraseUpdate.passphrase.old}
            />
            {!isChecking && isValid && (
              <CustomInputField
                label="Enter New Password"
                onChange={(value) => {
                  setPassphraseUpdate((prev) => ({
                    ...prev,
                    passphrase: {
                      ...prev.passphrase,
                      new: value,
                    },
                  }));
                }}
                type={"password"}
                passwordType="NONE"
                currentValue={passphraseUpdate.passphrase.new}
                disabled={!isValid}
              />
            )}
          </PopUpFormButton>
        ) : null}
        {!!onShare && onShare !== undefined && !!onShare ? (
          <StyledIconButton
            icon={LinkIcon}
            title="Share"
            onClick={() => onShare?.(itemData)}
            size={24}
          />
        ) : null}
        {!!onBlock && onBlock !== undefined && !itemData?.isBlocked() ? (
          <ConfirmationButton
            text="Block"
            onClick={() => onBlock?.(itemData)}
            icon={ProhibitIcon}
            alertTextTitle="Block Contact"
            strict
          />
        ) : null}

        {!!onUnBlock && onUnBlock !== undefined && !!itemData?.isBlocked() ? (
          <ConfirmationButton
            text="Unblock"
            onClick={() => onUnBlock?.(itemData)}
            icon={CheckCircleIcon}
            alertTextTitle="Unblock Contact"
            strict
          />
        ) : null}

        {!!onDelete && onDelete !== undefined && !!canDelete ? (
          <DeleteButton title="contact" onClick={() => onDelete?.(itemData)} />
        ) : null}
      </ActionButtonRow>
      <BodyContainer onClick={handleOnPressed}>
        <ColumnInfo>
          <ColumnMain>
            <UserNameRow>
              <ItemTitle $blocked={itemData?.isBlocked()}>
                {itemData?.meta?.label ?? "User Account"}
              </ItemTitle>
              {itemData?.isBlocked() && (
                <ProhibitIcon size={18} color={theme.colors.error} />
              )}
            </UserNameRow>

            <SubColumnContainer>
              <RowTextItem
                textKey="Address"
                textValue={itemData?.id}
                highlight={true}
              />
            </SubColumnContainer>
          </ColumnMain>
        </ColumnInfo>
      </BodyContainer>
    </RootContainer>
  );
};

export default CBaseUserAccount;
