import { arrayToBase64, base64ToArrayBuffer } from "../utils/utilities";
import { mnemonicToSeedSync } from "@scure/bip39";
import * as ed25519 from "@stablelib/ed25519";
import ed2curve from "ed2curve";
import nacl from "tweetnacl";
import { hash } from "@stablelib/sha256";
import {
  x25519SharedSecret,
  generateRandomBytes,
  aesGcmEncrypt,
  aesGcmDecrypt,
  fingerprintFromPublicRaw,
  IV_LENGTH,
} from "./crypto-provider";
import type {
  EnvelopePayload,
  MultiRecipientPayload,
  SingleRecipientPayload,
} from "../types";

export interface EncryptionIdentity {
  publicKey: CryptoKey | { raw: Uint8Array };
  privateKey: CryptoKey | { raw: Uint8Array };
  fingerprint: string;
}

/**
 * EncryptionEngine
 * ----------------
 * Core cryptographic engine for MajikMessage.
 *
 * ⚠️ Background-only. Never import this into content scripts.
 */

export class EncryptionEngine {
  /* ================================
   * Identity
   * ================================ */

  /**
   * Generates a long-term X25519 identity keypair.
   */
  static async generateIdentity(): Promise<EncryptionIdentity> {
    try {
      // Generate an Ed25519 keypair (stablelib) and convert to Curve25519
      const ed = ed25519.generateKeyPair();

      const skCurve = ed2curve.convertSecretKey(ed.secretKey);
      const pkCurve = ed2curve.convertPublicKey(ed.publicKey);

      if (!skCurve || !pkCurve) {
        throw new CryptoError("Failed to convert Ed25519 keys to Curve25519");
      }

      const pkBytes = new Uint8Array(pkCurve as Uint8Array);
      const skBytes = new Uint8Array(skCurve as Uint8Array);

      // Use raw key wrappers (Stablelib-backed) to avoid WebCrypto import variability
      const publicKey = { type: "public", raw: pkBytes } as any;
      const privateKey = { type: "private", raw: skBytes } as any;

      const fingerprint = fingerprintFromPublicRaw(pkBytes);

      return { publicKey, privateKey, fingerprint };
    } catch (err) {
      throw new CryptoError("Failed to generate identity", err);
    }
  }

  /**
   * Derive an identity deterministically from a BIP39 mnemonic.
   * Uses Stablelib Ed25519 to derive a keypair from seed and converts to X25519.
   */
  static async deriveIdentityFromMnemonic(
    mnemonic: string,
  ): Promise<EncryptionIdentity> {
    try {
      if (typeof mnemonic !== "string" || mnemonic.trim().length === 0) {
        throw new CryptoError("Mnemonic must be a non-empty string");
      }

      // Convert mnemonic to seed (64 bytes) then reduce to 32 bytes
      const seed = mnemonicToSeedSync(mnemonic); // Buffer
      const seed32 = new Uint8Array(seed.slice(0, 32));

      // Derive Ed25519 keypair from seed (stablelib)
      const ed = ed25519.generateKeyPairFromSeed(seed32);

      // Convert Ed25519 keys to X25519 (curve25519)
      const skCurve = ed2curve.convertSecretKey(ed.secretKey);
      const pkCurve = ed2curve.convertPublicKey(ed.publicKey);

      if (!skCurve || !pkCurve) {
        throw new CryptoError(
          "Failed to convert derived Ed25519 keys to Curve25519",
        );
      }

      // Ensure plain Uint8Array
      const pkCurveBytes = new Uint8Array(pkCurve as Uint8Array);
      const skCurveBytes = new Uint8Array(skCurve as Uint8Array);

      const publicKey = { type: "public", raw: pkCurveBytes } as any;
      const privateKey = { type: "private", raw: skCurveBytes } as any;

      const fingerprint = fingerprintFromPublicRaw(pkCurveBytes);

      return { publicKey, privateKey, fingerprint };
    } catch (err) {
      throw new CryptoError("Failed to derive identity from mnemonic", err);
    }
  }

  /* ================================
   * Solo Encryption (existing original logic)
   * ================================ */

  static async encryptSoloMessage(
    plaintext: string,
    recipientPublicKey: CryptoKey | { raw: Uint8Array },
  ): Promise<SingleRecipientPayload> {
    this.assertNonEmptyString(plaintext);
    this.assertPublicKey(recipientPublicKey);

    const recipientRaw = await this._extractPublicRaw(recipientPublicKey);

    // Ephemeral X25519 keypair
    const ephPrivate = generateRandomBytes(32);
    const ephPublic = nacl.scalarMult.base(ephPrivate);

    // Shared secret -> AES key
    const shared = x25519SharedSecret(ephPrivate, recipientRaw);
    const aesKey = hash(shared);

    const iv = generateRandomBytes(IV_LENGTH);
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = aesGcmEncrypt(aesKey, iv, encoded);

    return {
      iv: arrayToBase64(iv),
      ciphertext: arrayToBase64(ciphertext),
      ephemeralPublicKey: arrayToBase64(ephPublic),
    };
  }

  static async decryptSoloMessage(
    payload: SingleRecipientPayload,
    recipientPrivateKey: CryptoKey | { raw: Uint8Array },
  ): Promise<string> {
    this.assertPrivateKey(recipientPrivateKey);
    this.assertPayload(payload);

    const privRaw = this._extractPrivateRaw(recipientPrivateKey);
    const ephRaw = new Uint8Array(
      base64ToArrayBuffer(payload.ephemeralPublicKey),
    );
    const shared = x25519SharedSecret(privRaw, ephRaw);
    const aesKey = hash(shared);

    const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
    const ciphertext = new Uint8Array(base64ToArrayBuffer(payload.ciphertext));

    const plain = aesGcmDecrypt(aesKey, iv, ciphertext);
    if (!plain) throw new CryptoError("Decryption failed (auth failed)");

    return new TextDecoder().decode(plain);
  }

  /* ================================
   * Group Encryption
   * ================================ */

  static async encryptGroupMessage(
    plaintext: string,
    recipients: Array<{
      id: string;
      publicKey: CryptoKey | { raw: Uint8Array };
    }>,
  ): Promise<MultiRecipientPayload> {
    this.assertNonEmptyString(plaintext);
    if (!recipients || recipients.length === 0) {
      throw new CryptoError("No recipients provided");
    }

    // Generate ephemeral AES key for the message
    const aesKey = generateRandomBytes(32);
    const iv = generateRandomBytes(IV_LENGTH);
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = aesGcmEncrypt(aesKey, iv, encoded);

    // Ephemeral X25519 keypair for encrypting AES key
    const ephPrivate = generateRandomBytes(32);
    const ephPublic = nacl.scalarMult.base(ephPrivate);

    const keys = await Promise.all(
      recipients.map(async (r) => {
        const recipientRaw = await this._extractPublicRaw(r.publicKey);
        const shared = x25519SharedSecret(ephPrivate, recipientRaw);

        const nonce = generateRandomBytes(24); // random per recipient
        const ephemeralEncryptedKey = nacl.secretbox(aesKey, nonce, shared);

        return {
          fingerprint: fingerprintFromPublicRaw(recipientRaw),
          ephemeralEncryptedKey: arrayToBase64(ephemeralEncryptedKey),
          nonce: arrayToBase64(nonce),
        };
      }),
    );

    return {
      iv: arrayToBase64(iv),
      ciphertext: arrayToBase64(ciphertext),
      keys,
      ephemeralPublicKey: arrayToBase64(ephPublic), // needed for decryption
    };
  }

  static async decryptGroupMessage(
    payload: MultiRecipientPayload,
    recipient: CryptoKey | { raw: Uint8Array },
    fingerprint: string,
  ): Promise<string> {
    this.assertPrivateKey(recipient);
    this.assertPayload(payload);

    const keyEntry = payload.keys.find((k) => k.fingerprint === fingerprint);
    if (!keyEntry) throw new CryptoError("No encrypted key for this recipient");

    const privRaw = this._extractPrivateRaw(recipient);
    const ephPublic = new Uint8Array(
      base64ToArrayBuffer(payload.ephemeralPublicKey),
    );
    const shared = x25519SharedSecret(privRaw, ephPublic);

    const nonce = new Uint8Array(base64ToArrayBuffer(keyEntry.nonce));
    const encryptedKey = new Uint8Array(
      base64ToArrayBuffer(keyEntry.ephemeralEncryptedKey),
    );
    const aesKey = nacl.secretbox.open(encryptedKey, nonce, shared);
    if (!aesKey)
      throw new CryptoError("Failed to decrypt AES key for group message");

    const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
    const ciphertext = new Uint8Array(base64ToArrayBuffer(payload.ciphertext));
    const plain = aesGcmDecrypt(aesKey, iv, ciphertext);
    if (!plain) throw new CryptoError("Failed to decrypt group message");

    return new TextDecoder().decode(plain);
  }

  /* ================================
   * Fingerprinting
   * ================================ */

  /**
   * Generates a SHA-256 fingerprint from a public key.
   */
  static async fingerprintFromPublicKey(
    publicKey: CryptoKey | { raw: Uint8Array },
  ): Promise<string> {
    // Accept both CryptoKey and raw wrappers; use stablelib sha256 via provider
    const anyKey: any = publicKey as any;
    let rawBytes: Uint8Array;
    if (anyKey && anyKey.raw instanceof Uint8Array) {
      rawBytes = anyKey.raw;
    } else {
      this.assertPublicKey(publicKey);
      const exported = await crypto.subtle.exportKey(
        "raw",
        publicKey as CryptoKey,
      );
      rawBytes = new Uint8Array(exported);
    }

    return fingerprintFromPublicRaw(rawBytes);
  }

  /* ================================
   * Helpers
   * ================================ */

  private static async _extractPublicRaw(
    key: CryptoKey | { raw: Uint8Array },
  ): Promise<Uint8Array> {
    // Unified stablelib-backed path: export recipient raw public key then do X25519 scalar-mult
    const recipientAny: any = key as any;
    let recipientRaw: Uint8Array;
    if (recipientAny && recipientAny.raw instanceof Uint8Array) {
      return (recipientRaw = recipientAny.raw);
    } else {
      try {
        const exported = await crypto.subtle.exportKey("raw", key as CryptoKey);
        recipientRaw = new Uint8Array(exported);
        return recipientRaw;
      } catch (e) {
        throw new CryptoError("Failed to export recipient public key", e);
      }
    }
  }

  private static _extractPrivateRaw(
    key: CryptoKey | { raw: Uint8Array },
  ): Uint8Array {
    const anyKey: any = key as any;
    if (anyKey.raw instanceof Uint8Array) return anyKey.raw;
    throw new CryptoError("Cannot extract raw private key");
  }

  /* ================================
   * Validation Helpers
   * ================================ */

  private static assertNonEmptyString(value: string): void {
    if (!value || typeof value !== "string") {
      throw new CryptoError("Plaintext must be a non-empty string");
    }
  }

  private static assertPublicKey(key: CryptoKey | { raw: Uint8Array }): void {
    const anyKey: any = key as any;
    if (!key) throw new CryptoError("Invalid public key");
    if (anyKey.raw instanceof Uint8Array) return; // raw wrapper
    if ((key as CryptoKey).type !== "public") {
      throw new CryptoError("Invalid public key");
    }
  }

  private static assertPrivateKey(key: CryptoKey | { raw: Uint8Array }): void {
    const anyKey: any = key as any;
    if (!key) throw new CryptoError("Invalid private key");
    if (anyKey.raw instanceof Uint8Array) return; // raw wrapper
    if ((key as CryptoKey).type !== "private") {
      throw new CryptoError("Invalid private key");
    }
  }

  private static assertPayload(payload: EnvelopePayload): void {
    if (!payload?.iv || !payload?.ciphertext) {
      throw new CryptoError("Malformed encrypted payload");
    }
  }
}

/* ================================
 * Errors
 * ================================ */

export class CryptoError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "CryptoError";
    this.cause = cause;
  }
}
