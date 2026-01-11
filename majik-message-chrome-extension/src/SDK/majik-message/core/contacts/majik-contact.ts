import { ISODateString } from "../types";
import { arrayBufferToBase64 } from "../utils/utilities";

/* -------------------------------
 * Types
 * ------------------------------- */

export type SerializedMajikContact = Omit<MajikContactData, "publicKey"> & {
  publicKeyBase64: string;
};

export interface MajikContactMeta {
  label?: string;
  notes?: string;
  blocked?: boolean;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface MajikContactData {
  id: string;
  // publicKey may be a WebCrypto `CryptoKey` or a raw-key wrapper { raw: Uint8Array }
  publicKey: CryptoKey | { raw: Uint8Array };
  fingerprint: string;
  meta?: MajikContactMeta;
}

export interface MajikContactCard {
  id: string;
  publicKey: string;
  fingerprint: string;
  label: string;
}

/* -------------------------------
 * Errors
 * ------------------------------- */

export class MajikContactError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "MajikContactError";
    this.cause = cause;
  }
}

/* -------------------------------
 * MajikContact Class
 * ------------------------------- */

export class MajikContact {
  public readonly id: string;
  public readonly publicKey: CryptoKey | { raw: Uint8Array };
  public readonly fingerprint: string;
  public meta: MajikContactMeta;

  constructor(data: MajikContactData) {
    this.assertId(data.id);
    this.assertPublicKey(data.publicKey);
    this.assertFingerprint(data.fingerprint);

    this.id = data.id;
    this.publicKey = data.publicKey;
    this.fingerprint = data.fingerprint;

    this.meta = {
      label: data.meta?.label || "",
      notes: data.meta?.notes || "",
      blocked: data.meta?.blocked || false,
      createdAt: data.meta?.createdAt || new Date().toISOString(),
      updatedAt: data.meta?.updatedAt || new Date().toISOString(),
    };
  }

  static create(
    id: string,
    publicKey: CryptoKey | { raw: Uint8Array },
    fingerprint: string,
    meta?: Partial<MajikContactMeta>
  ): MajikContact {
    return new MajikContact({
      id,
      publicKey,
      fingerprint,
      meta,
    });
  }

  private assertId(id: string) {
    if (!id || typeof id !== "string") {
      throw new MajikContactError("Contact ID must be a non-empty string");
    }
  }

  private assertPublicKey(key: CryptoKey | { raw: Uint8Array }) {
    // Accept either a WebCrypto CryptoKey (with .type === 'public')
    // or a raw-key wrapper object that contains a Uint8Array `raw` field.
    if (!key) throw new MajikContactError("Invalid public key");
    const anyKey: any = key as any;
    if (anyKey && typeof anyKey === "object") {
      if (anyKey.type === "public") return;
      if (anyKey.raw instanceof Uint8Array) return;
    }
    throw new MajikContactError("Invalid public key");
  }

  private assertFingerprint(fingerprint: string) {
    if (!fingerprint || typeof fingerprint !== "string") {
      throw new MajikContactError("Fingerprint must be a non-empty string");
    }
  }

  private updateTimestamp() {
    this.meta.updatedAt = new Date().toISOString();
  }

  updateLabel(label: string): this {
    if (typeof label !== "string")
      throw new MajikContactError("Label must be a string");
    this.meta.label = label;
    this.updateTimestamp();
    return this;
  }

  updateNotes(notes: string): this {
    if (typeof notes !== "string")
      throw new MajikContactError("Notes must be a string");
    this.meta.notes = notes;
    this.updateTimestamp();
    return this;
  }

  isBlocked(): boolean {
    return this.meta.blocked || false;
  }

  setBlocked(blocked: boolean): this {
    if (typeof blocked !== "boolean")
      throw new MajikContactError("Blocked must be boolean");
    this.meta.blocked = blocked;
    this.updateTimestamp();
    return this;
  }

  // Idempotent block/unblock for safe scanning
  block(): this {
    if (!this.isBlocked()) this.setBlocked(true);
    return this;
  }

  unblock(): this {
    if (this.isBlocked()) this.setBlocked(false);
    return this;
  }

  async toJSON(): Promise<SerializedMajikContact> {
    // Support both CryptoKey and raw-key wrappers (fallbacks when WebCrypto X25519 unsupported)
    try {
      // If it's a CryptoKey, export with SubtleCrypto
      const raw = await crypto.subtle.exportKey(
        "raw",
        this.publicKey as CryptoKey
      );
      return {
        id: this.id,
        fingerprint: this.fingerprint,
        meta: { ...this.meta },
        publicKeyBase64: arrayBufferToBase64(raw),
      };
    } catch (e) {
      // Fallback: publicKey may be a wrapper with `raw` Uint8Array
      const maybe: any = this.publicKey as any;
      if (maybe && maybe.raw instanceof Uint8Array) {
        return {
          id: this.id,
          fingerprint: this.fingerprint,
          meta: { ...this.meta },
          publicKeyBase64: arrayBufferToBase64(maybe.raw.buffer),
        };
      }
      throw e;
    }
  }

  static isBlocked(contact: MajikContact): boolean {
    return !!contact.meta.blocked;
  }
}
