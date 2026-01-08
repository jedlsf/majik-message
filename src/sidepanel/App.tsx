import { useEffect, useState } from "react";

import ContactsPanel from "../components/panels/ContactsPanel";
import ScannerPanel from "../components/panels/ScannerPanel";
import UnlockModal from "../components/UnlockModal";
import { KeyStore } from "../SDK/majik-message/core/crypto/keystore";

import AccountsPanel from "../components/panels/AccountsPanel";
import { MajikMessage } from "../SDK/majik-message/majik-message";
import { useMajik } from "./MajikMessageWrapper";
import { toast, Toaster } from "sonner";
import DynamicPlaceholder from "../components/foundations/DynamicPlaceholder";
import styled from "styled-components";
import DynamicPagedTab, {
  TabContent,
} from "../components/functional/DynamicPagedTab";
import {
  AddressBookIcon,
  EnvelopeIcon,
  GearIcon,
  UserIcon,
} from "@phosphor-icons/react";
import MessagePanel from "../components/panels/MessagePanel";

const RootContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: inherit;
  background-color: ${({ theme }) => theme.colors.primaryBackground};
`;

function App() {
  const { majik, loading, updateInstance } = useMajik();
  const [unlockId, setUnlockId] = useState<string | null>(null);
  const [unlockResolver, setUnlockResolver] = useState<
    ((s: string) => void) | null
  >(null);

  const [, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    // Wire KeyStore.onUnlockRequested to present our React modal
    KeyStore.onUnlockRequested = (id: string) => {
      return new Promise<string>((resolve) => {
        setUnlockId(id);
        setUnlockResolver(() => resolve);
      });
    };

    return () => {
      KeyStore.onUnlockRequested = undefined;
    };
  }, []);

  useEffect(() => {
    // define an async function inside useEffect
    const unlockIdentity = async () => {
      try {
        if (!majik) return;
        const activeAccount = majik.getActiveAccount();
        if (!activeAccount) return;
        await majik.ensureIdentityUnlocked(activeAccount.id);
        toast.success("Access granted", {
          description: "Your identity has been securely unlocked.",
          id: "toast-success-unlock",
        });

        console.log("Access granted: Identity unlocked");
      } catch (err) {
        toast.error("Unlock failed", {
          description: `Incorrect passphrase. Please try again. ${err}`,
          id: "toast-error-unlock",
        });
        console.warn("Failed to unlock identity:", err);
      }
    };

    // call the async function
    unlockIdentity();
  }, [majik]); // add dependencies as needed

  const handleCancel = () => {
    if (unlockResolver) unlockResolver("");
    setUnlockId(null);
    setUnlockResolver(null);
  };

  const handleSubmit = (pass: string) => {
    if (unlockResolver) unlockResolver(pass);
    setUnlockId(null);
    setUnlockResolver(null);
  };

  const handleRefreshInstance = (data: MajikMessage) => {
    setRefreshKey((prev) => prev + 1);
    updateInstance(data);
  };

  if (!!loading) {
    return (
      <DynamicPlaceholder loading={loading}>Loading...</DynamicPlaceholder>
    );
  }

  if (!majik) {
    return (
      <DynamicPlaceholder>
        There seems to be a problem with Majik Message...
      </DynamicPlaceholder>
    );
  }

  const tabs: TabContent[] = [
    {
      id: "accounts",
      icon: UserIcon,
      name: "Accounts",
      content: <AccountsPanel majik={majik} onUpdate={handleRefreshInstance} />,
    },
    {
      id: "contacts",
      name: "Contacts",
      icon: AddressBookIcon,
      content: <ContactsPanel majik={majik} onUpdate={handleRefreshInstance} />,
    },
    {
      id: "messsage",
      name: "Message",
      icon: EnvelopeIcon,
      content: <MessagePanel majik={majik} onUpdate={handleRefreshInstance} />,
    },
    {
      id: "scanner",
      icon: GearIcon,
      name: "Scanner",
      content: <ScannerPanel majik={majik} />,
    },
  ];

  return (
    <RootContainer className="popup-container">
      <DynamicPagedTab tabs={tabs} />
      <UnlockModal
        identityId={unlockId}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        majik={majik}
      />
      <Toaster expand={true} position="top-right" />
    </RootContainer>
  );
}

export default App;
