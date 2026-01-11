import { useEffect, useState } from "react";
import "./App.css";

import { KeyStore } from "../../SDK/majik-message/core/crypto/keystore";
import UnlockModal from "../../components/UnlockModal";
import { Toaster } from "sonner";

function App() {
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

  return (
    <div className="popup-container">
      <UnlockModal
        identityId={unlockId}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
      <Toaster expand={true} position="top-right" />
    </div>
  );
}

export default App;
