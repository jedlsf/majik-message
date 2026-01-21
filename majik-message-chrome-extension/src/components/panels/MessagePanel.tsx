import styled from "styled-components";
import { useMemo, useState } from "react";
import PopUpFormButton from "../foundations/PopUpFormButton";
import { UserPlusIcon } from "@phosphor-icons/react";
import CustomInputField from "../foundations/CustomInputField";
import { MajikMessage } from "../../SDK/majik-message/majik-message";

import { toast } from "sonner";

import TextEditPreviewInput from "../functional/TextEditPreviewInput";

import { MajikContact } from "../../SDK/majik-message/core/contacts/majik-contact";
import { MajikContactListSelector } from "../MajikContactListSelector";
import {
  SectionSubTitle,
  SectionTitleFrame,
} from "../../globals/styled-components";
import { MessageEnvelope } from "../../SDK/majik-message/core/messages/message-envelope";

const Container = styled.div`
  width: inherit;
  height: 100%;
  padding: 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 8px 0;
  width: inherit;
  gap: 8px;
`;

interface MessagePanelProps {
  majik: MajikMessage;
  onUpdate?: (updatedInstance: MajikMessage) => void;
}

const MessagePanel: React.FC<MessagePanelProps> = ({ majik, onUpdate }) => {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [inviteKey, setInviteKey] = useState<string>("");

  const [recipients, setRecipients] = useState<MajikContact[]>(() => {
    const myAccount = majik.getActiveAccount();
    if (!myAccount) return [];
    return [myAccount];
  });

  const [myAccount] = useState<MajikContact | null>(() => {
    const userAccount = majik.getActiveAccount();
    if (!userAccount) return null;
    return userAccount;
  });

  const handleAddContact = async () => {
    if (!majik) return;

    if (!inviteKey?.trim()) {
      toast.error("Invalid Invite Key", {
        description: "Please provide a valid invite key.",
        id: `toast-error-add-${inviteKey}`,
      });
      return;
    }
    try {
      await majik.importContactFromString(inviteKey);
      setRefreshKey((prev) => prev + 1);
      toast.success("New Friend Added Succesfully", {
        description: inviteKey,
        id: `toast-success-add-${inviteKey}`,
      });
    } catch (e) {
      toast.error("Failed to Add New Contact", {
        description: (e as any)?.message || e,
        id: "error-majik-add",
      });
    }
  };

  const handleRecipientsUpdate = (updated: MajikContact[]) => {
    if (updated.length === 0) {
      if (!myAccount) {
        setRecipients([]);
      } else {
        setRecipients([myAccount]);
      }
    }
    setRecipients(updated);
    onUpdate?.(majik);
  };

  const handleRecipientsClear = () => {
    if (!myAccount) {
      setRecipients([]);
    } else {
      setRecipients([myAccount]);
    }

    onUpdate?.(majik);
  };

  const handleEncryptMessage = async (input: string): Promise<string> => {
    if (!input?.trim()) {
      return "";
    }

    if (!myAccount) {
      return "No active account found.";
    }

    if (!recipients || recipients.length === 0) {
      return "No recipients selected.";
    }

    const recipientIds = recipients.map((contact) => contact.id);

    const encryptedMessage = await majik.encryptTextForScanner(
      input,
      recipientIds,
      false
    );
    return encryptedMessage ?? "";
  };

  const handleDecryptMessage = async (input: string): Promise<string> => {
    if (!input?.trim()) {
      return "";
    }

    if (!myAccount) {
      return "No active account found.";
    }

    const envelope = MessageEnvelope.fromMatchedString(input);

    const encryptedMessage = await majik.decryptEnvelope(envelope, true);
    return encryptedMessage;
  };

  const contacts = useMemo(() => {
    if (!majik) return [];

    return majik.listContacts(false);
  }, [majik, refreshKey]);

  return (
    <Container>
      <SectionTitleFrame>
        <Row>
          Message
          <div style={{ display: "flex", flexDirection: "row" }}>
            <PopUpFormButton
              icon={UserPlusIcon}
              text="Add Friend"
              alertTextTitle="Add Friend"
              onClick={handleAddContact}
            >
              <CustomInputField
                onChange={(e) => setInviteKey(e)}
                maxChar={500}
                label="Invite Key"
                required
                importProp={{
                  type: "txt",
                }}
              />
            </PopUpFormButton>
          </div>
        </Row>
      </SectionTitleFrame>

      <BodyContainer>
        <SectionSubTitle>Recipients</SectionSubTitle>
        <MajikContactListSelector
          id="message-recipients"
          contacts={contacts}
          value={recipients}
          tooltip="Add Recipient"
          onUpdate={handleRecipientsUpdate}
          onClearAll={handleRecipientsClear}
          refKey="recipient"
          allowEmpty={false}
        />

        <TextEditPreviewInput
          onEncrypt={handleEncryptMessage}
          onDecrypt={handleDecryptMessage}
          downloadName={`Message from ${
            myAccount?.meta?.label || myAccount?.id
          }`}
        />
      </BodyContainer>
    </Container>
  );
};

export default MessagePanel;
