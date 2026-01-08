import React, { createContext, useContext, useEffect, useState } from "react";
import { MajikMessage } from "../SDK/majik-message/majik-message";
import { KeyStore } from "../SDK/majik-message/core/crypto/keystore";
import { EnvelopeCache } from "../SDK/majik-message/core/messages/envelope-cache";

interface MajikContextValue {
  majik: MajikMessage | null;
  loading: boolean;
  locked: boolean;
  setPin?: (pin: string) => Promise<void>;
  clearPin?: () => Promise<void>;
  unlockWithPin?: (pin: string) => Promise<boolean>;
  updateInstance: (updatedInstance: MajikMessage) => void;
}

const MajikContext = createContext<MajikContextValue>({
  loading: true,
  locked: false,
  majik: null,
  updateInstance: () => {},
});

export const useMajik = () => useContext(MajikContext);

export const MajikMessageWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [majik, setMajik] = useState<MajikMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const instance = await MajikMessage.loadOrCreate({
          keyStore: KeyStore,
          envelopeCache: new EnvelopeCache(),
        });

        if (!mounted) return;

        setMajik(instance);

        const pinHash = (instance as any).getPinHash?.();
        setLocked(!!pinHash);
      } catch (e) {
        console.error("Failed to initialize MajikMessage:", e);

        if (!mounted) return;

        const instance = new MajikMessage({
          keyStore: KeyStore,
          envelopeCache: new EnvelopeCache(),
        });

        setMajik(instance);
        setLocked(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

 
  const updateInstance = (data: MajikMessage) => {
    console.log("Update Received: ", data);
    setMajik(data);
  };

  const setPin = async (pin: string) => {
    if (!majik) throw new Error("Majik not initialized");
    await majik.setPIN(pin);
    setLocked(false);
  };

  const clearPin = async () => {
    if (!majik) throw new Error("Majik not initialized");
    await majik.clearPIN();
    setLocked(false);
  };

  const unlockWithPin = async (pin: string) => {
    if (!majik) throw new Error("Majik not initialized");
    const ok = await majik.isValidPIN(pin);
    if (ok) setLocked(false);
    return ok;
  };

  return (
    <MajikContext.Provider
      value={{
        majik,
        loading,
        locked,
        setPin,
        clearPin,
        unlockWithPin,
        updateInstance,
      }}
    >
      {children}
    </MajikContext.Provider>
  );
};
