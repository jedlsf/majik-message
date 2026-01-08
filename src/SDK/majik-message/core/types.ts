export type ISODateString = string;

export interface MAJIK_API_RESPONSE {
  success: boolean;
  message: string;
  code?: string;
}

export interface SingleRecipientPayload {
  iv: string;
  ciphertext: string;
  ephemeralPublicKey: string;
}

export interface MultiRecipientPayload {
  iv: string; // AES-GCM IV
  ciphertext: string; // AES-GCM ciphertext
  ephemeralPublicKey: string; // shared by all recipients
  keys: RecipientKeys[];
}

export interface RecipientKeys {
  fingerprint: string;
  ephemeralEncryptedKey: string;
  nonce: string; // secretbox nonce (required)
}

export type EnvelopePayload = SingleRecipientPayload | MultiRecipientPayload;
