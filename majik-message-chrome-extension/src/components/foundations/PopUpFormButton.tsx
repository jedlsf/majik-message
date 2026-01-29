import React, { useState } from "react";
import styled from "styled-components";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

import StyledIconButton from "./StyledIconButton";
import { ButtonPrimaryConfirm } from "../../globals/buttons";
import DuoButton from "./DuoButton";
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogTitle,
} from "../../globals/styled-dialogs";
import ScrollableForm from "./ScrollableForm";

const Button = styled(ButtonPrimaryConfirm)`
  min-width: 100px;
`;

interface PopUpFormButtonProps {
  onClick?: () => void;
  onCancel?: () => void;
  text?: string;
  disabled?: boolean;
  icon?: React.ComponentType;
  alertTextTitle?: string;
  children: React.ReactNode;
  isDisabledButtonA?: boolean;
  isDisabledButtonB?: boolean;
  scrollable?: boolean;
}

const PopUpFormButton: React.FC<PopUpFormButtonProps> = ({
  onClick,
  onCancel,
  text = "Confirm",
  disabled = false,
  icon,
  alertTextTitle = "Confirm Action",
  children,
  isDisabledButtonA = false,
  isDisabledButtonB = false,
  scrollable = false,
}) => {
  const [open, setOpen] = useState<boolean>(false);

  const handleOnConfirm = () => {
    onClick?.();
    setOpen(false); // Close dialog after confirming
  };

  const handleOnCancel = () => {
    onCancel?.();
    setOpen(false); // Close dialog after confirming
  };

  return (
    <>
      {!!icon ? (
        <StyledIconButton
          icon={icon}
          size={25}
          onClick={() => setOpen(true)}
          disabled={disabled}
          title={text}
        />
      ) : (
        <Button onClick={() => setOpen(true)} disabled={disabled}>
          {text}
        </Button>
      )}

      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Portal>
          <DialogOverlay>
            <DialogContent>
              <DialogTitle>{alertTextTitle}</DialogTitle>
              <DialogDescription></DialogDescription>
              {scrollable ? (
                <ScrollableForm
                  onClickCancel={handleOnCancel}
                  onClickProceed={handleOnConfirm}
                  isDisabledCancel={isDisabledButtonA}
                  isDisabledProceed={isDisabledButtonB}
                  textCancelButton="Cancel"
                  textProceedButton="Apply"
                >
                  {[children]}
                </ScrollableForm>
              ) : (
                <>
                  {[children]}
                  <DuoButton
                    textButtonA="Cancel"
                    textButtonB="Apply"
                    onClickButtonA={handleOnCancel}
                    onClickButtonB={handleOnConfirm}
                    isDisabledButtonA={isDisabledButtonA}
                    isDisabledButtonB={isDisabledButtonB}
                  />
                </>
              )}
            </DialogContent>
          </DialogOverlay>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
};

export default PopUpFormButton;
