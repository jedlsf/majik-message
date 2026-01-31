// MajikahProvider.tsx
import React, { useEffect, useState } from "react";

import { MajikahSession } from "./majikah-session";
import { MajikahContext } from "./majikah-context";
import { toast } from "sonner";
import NewPasswordModal from "../NewPasswordModal";

export const MajikahProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [majikah, setMajikah] = useState<MajikahSession>(new MajikahSession());
  const [loading, setLoading] = useState(true);
  const [, setRefreshKey] = useState(0);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordEmail, setPasswordEmail] = useState<string | undefined>();
  const passwordResolverRef = React.useRef<
    ((password: string | null) => void) | null
  >(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Initialize session from persisted state or create new
        const session = await MajikahSession.initialize();
        if (!mounted) return;

        session.setNotifyHandler((message, type = "success") => {
          if (type === "success") {
            toast.success("Success", {
              description: message,
              id: "toast-handler-notif-success",
            });
          } else {
            toast.error("Error", {
              description: message,
              id: "toast-handler-notif-error",
            });
          }
        });

        session.setPasswordRecoveryHandler((email) => {
          return new Promise<string | null>((resolve) => {
            passwordResolverRef.current = resolve;
            setPasswordEmail(email);
            setPasswordModalOpen(true);
          });
        });

        setMajikah(session);
      } catch (error) {
        console.error("Failed to initialize MajikahSession:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Optional: method to force reload state
  const reloadSession = async (): Promise<void> => {
    if (!majikah) return;
    setLoading(true);
    await majikah.loadState();
    setRefreshKey((prev) => prev + 1);
    setLoading(false);
  };

  return (
    <MajikahContext.Provider
      value={{
        majikah,
        loading,
        reloadSession,
      }}
    >
      {children}
      <NewPasswordModal
        open={passwordModalOpen}
        email={passwordEmail}
        onCancel={() => {
          passwordResolverRef.current?.(null);
          passwordResolverRef.current = null;
          setPasswordModalOpen(false);
        }}
        onSubmit={(password) => {
          passwordResolverRef.current?.(password);
          passwordResolverRef.current = null;
          setPasswordModalOpen(false);
        }}
      />
    </MajikahContext.Provider>
  );
};
