import {
  EnvelopePayload,
  RecipientKeys,
  SingleRecipientPayload,
} from "../types";
import { base64ToArrayBuffer, arrayBufferToBase64 } from "../utils/utilities";

/* -------------------------------
 * Constants
 * ------------------------------- */

const ENVELOPE_PREFIX = "~*$MJKMSG";
const ENVELOPE_REGEX = /^~\*\$MJKMSG:([A-Za-z0-9+/=]+)$/;

const MAX_ENVELOPE_LENGTH = 16_384; // raw string
const MAX_PAYLOAD_BYTES = 12_288; // decoded binary

/* -------------------------------
 * Error Types
 * ------------------------------- */

export type EnvelopeErrorCode =
  | "INVALID_INPUT"
  | "FORMAT_ERROR"
  | "VALIDATION_ERROR";

export class MessageEnvelopeError extends Error {
  readonly code: EnvelopeErrorCode;
  readonly raw?: string;

  constructor(code: EnvelopeErrorCode, message: string, raw?: string) {
    super(message);
    this.name = "MessageEnvelopeError";
    this.code = code;
    this.raw = raw;
  }
}

/* -------------------------------
 * MessageEnvelope
 * ------------------------------- */

export class MessageEnvelope {
  /** Raw decoded encrypted payload */
  readonly encryptedBlob: ArrayBuffer;

  static readonly PREFIX = ENVELOPE_PREFIX;
  static readonly DEFAULT_FINGERPRINT_LENGTH = 32;

  constructor(blob: ArrayBuffer) {
    this.encryptedBlob = blob;
  }

  get raw(): ArrayBuffer {
    return this.encryptedBlob;
  }

  

  /** Quick validation without throwing */
  static tryFromString(raw: unknown): {
    envelope?: MessageEnvelope;
    error?: MessageEnvelopeError;
  } {
    try {
      return { envelope: MessageEnvelope.fromMatchedString(raw) };
    } catch (err) {
      return { error: err as MessageEnvelopeError };
    }
  }

  static isEnvelopeCandidate(input: unknown): boolean {
    return (
      typeof input === "string" &&
      input.length <= MAX_ENVELOPE_LENGTH &&
      ENVELOPE_REGEX.test(input.trim())
    );
  }

  getVersion(): number {
    const view = new Uint8Array(this.encryptedBlob);
    if (view.length < 1) {
      throw new MessageEnvelopeError(
        "VALIDATION_ERROR",
        "Encrypted blob too short to contain version byte"
      );
    }
    return view[0];
  }

  /* -------------------------------
   * Factory
   * ------------------------------- */

  static fromMatchedString(raw: unknown): MessageEnvelope {
    if (typeof raw !== "string") {
      throw new MessageEnvelopeError(
        "INVALID_INPUT",
        "Envelope input must be a string"
      );
    }

    const trimmed = raw.trim();

    if (trimmed.length > MAX_ENVELOPE_LENGTH) {
      throw new MessageEnvelopeError(
        "VALIDATION_ERROR",
        "Envelope exceeds maximum allowed length",
        raw
      );
    }

    const match = ENVELOPE_REGEX.exec(trimmed);
    if (!match) {
      throw new MessageEnvelopeError(
        "FORMAT_ERROR",
        `Invalid envelope format. Expected ${ENVELOPE_PREFIX}:<base64>`,
        raw
      );
    }

    let decoded: ArrayBuffer;
    try {
      decoded = base64ToArrayBuffer(match[1]);
    } catch {
      throw new MessageEnvelopeError(
        "VALIDATION_ERROR",
        "Base64 payload failed to decode",
        raw
      );
    }

    if (decoded.byteLength === 0) {
      throw new MessageEnvelopeError(
        "VALIDATION_ERROR",
        "Decoded payload is empty",
        raw
      );
    }

    if (decoded.byteLength > MAX_PAYLOAD_BYTES) {
      throw new MessageEnvelopeError(
        "VALIDATION_ERROR",
        "Decoded payload exceeds size limit",
        raw
      );
    }

    return new MessageEnvelope(decoded);
  }

  /* -------------------------------
   * Extract Fingerprint (first one)
   * ------------------------------- */

  extractFingerprint(
    fingerprintLength = MessageEnvelope.DEFAULT_FINGERPRINT_LENGTH
  ): string {
    const view = new Uint8Array(this.encryptedBlob);
    if (view.length < 1 + fingerprintLength) {
      throw new MessageEnvelopeError(
        "VALIDATION_ERROR",
        "Encrypted blob too short to contain fingerprint"
      );
    }

    const fingerprintBytes = view.slice(1, 1 + fingerprintLength);
    const ab = fingerprintBytes.buffer.slice(
      fingerprintBytes.byteOffset,
      fingerprintBytes.byteOffset + fingerprintBytes.length
    );

    return arrayBufferToBase64(ab);
  }

  /* -------------------------------
   * Extract Encrypted Payload
   * ------------------------------- */

  extractEncryptedPayload(): EnvelopePayload {
    const view = new Uint8Array(this.encryptedBlob);
    const versionLength = 1;
    const fingerprintLength = MessageEnvelope.DEFAULT_FINGERPRINT_LENGTH;

    if (view.length < versionLength + fingerprintLength + 1) {
      throw new MessageEnvelopeError(
        "VALIDATION_ERROR",
        "Encrypted blob too short to contain payload"
      );
    }

    const payloadBytes = view.slice(versionLength + fingerprintLength);
    const payloadText = new TextDecoder().decode(payloadBytes);

    let parsed: EnvelopePayload;
    try {
      parsed = JSON.parse(payloadText);
    } catch {
      throw new MessageEnvelopeError(
        "VALIDATION_ERROR",
        "Failed to parse encrypted payload JSON"
      );
    }

    // Validate multi-recipient
    if ("keys" in parsed) {
      if (
        !parsed.iv ||
        !parsed.ciphertext ||
        !parsed.ephemeralPublicKey ||
        !Array.isArray(parsed.keys)
      ) {
        throw new MessageEnvelopeError(
          "VALIDATION_ERROR",
          "Multi-recipient payload missing required fields"
        );
      }

      for (const k of parsed.keys) {
        if (!k.fingerprint || !k.ephemeralEncryptedKey || !k.nonce) {
          throw new MessageEnvelopeError(
            "VALIDATION_ERROR",
            "Invalid key entry in multi-recipient payload"
          );
        }
      }
    }

    return parsed;
  }

  /* -------------------------------
   * Multi-Recipient Helpers
   * ------------------------------- */

  /**
   * Returns the ephemeral encrypted key for a given fingerprint
   */
  getRecipientKey(fingerprint: string): RecipientKeys | undefined {
    const payload = this.extractEncryptedPayload();

    if ("keys" in payload) {
      return payload.keys.find((k) => k.fingerprint === fingerprint);
    }

    return undefined;
  }

  getSingleRecipientPayload(): SingleRecipientPayload | undefined {
    const payload = this.extractEncryptedPayload();
    return "keys" in payload ? undefined : payload;
  }

  /**
   * Checks if this envelope contains a key for the given fingerprint
   */
  hasRecipient(fingerprint: string): boolean {
    return !!this.getRecipientKey(fingerprint);
  }

  isGroup(): boolean {
    const payload = this.extractEncryptedPayload();
    return "keys" in payload;
  }

  isSolo(): boolean {
    return !this.isGroup();
  }
}
