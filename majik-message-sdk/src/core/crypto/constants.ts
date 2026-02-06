import { MAJIK_API_RESPONSE } from "../types";

export const KEY_ALGO = { name: "ECDH", namedCurve: "X25519" } as const;

export const MAJIK_SALT = "MajikMessageSalt";
export const MAJIK_MNEMONIC_SALT = "MajikMessageMnemonicSalt";

export const API_DEFAULT_FAIL: MAJIK_API_RESPONSE = {
  message: "Something went wrong",
  success: false,
};
