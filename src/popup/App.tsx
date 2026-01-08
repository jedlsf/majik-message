import { useEffect, useState } from "react";

import ScannerPanel from "../components/panels/ScannerPanel";
import UnlockModal from "../components/UnlockModal";
import { KeyStore } from "../SDK/majik-message/core/crypto/keystore";

import { toast, Toaster } from "sonner";
import DynamicPlaceholder from "../components/foundations/DynamicPlaceholder";
import styled from "styled-components";

import { useMajik } from "../sidepanel/MajikMessageWrapper";

const RootContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 400px;
  background-color: ${({ theme }) => theme.colors.primaryBackground};
`;

function App() {
  const { majik, loading } = useMajik();
  const [unlockId, setUnlockId] = useState<string | null>(null);
  const [unlockResolver, setUnlockResolver] = useState<
    ((s: string) => void) | null
  >(null);

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

  if (!!loading) {
    return (
      <DynamicPlaceholder loading={loading}>Loading...</DynamicPlaceholder>
    );
  }

  if (!majik?.getActiveAccount()) {
    return (
      <DynamicPlaceholder loading={loading}>
        <strong>Get started</strong> <br />
        Create your account in the side panel to continue.
      </DynamicPlaceholder>
    );
  }

  return (
    <RootContainer className="popup-container">
      <ScannerPanel majik={majik} showHistoryLog={false} />
      <p className="text-center m-8">
        <i>Open the extension side panel to access advanced options.</i>
      </p>
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
