import {
  MessageEnvelope,
  MessageEnvelopeError,
} from "../messages/message-envelope";
import { MajikContactDirectory } from "../contacts/majik-contact-directory";
import { EnvelopeCache } from "../messages/envelope-cache";

/* -------------------------------
 * Event Callback Types
 * ------------------------------- */
interface ScannerEngineConfig {
  contactDirectory: MajikContactDirectory;
  envelopeCache?: EnvelopeCache; // optional
  onEnvelopeFound?: (envelope: MessageEnvelope) => void;
  onUntrusted?: (raw: string) => void;
  onError?: (err: Error, context?: { raw?: string }) => void;
}

/* -------------------------------
 * ScannerEngine
 * ------------------------------- */
export class ScannerEngine {
  private observer?: MutationObserver;
  private contactDirectory: MajikContactDirectory;
  private envelopeCache?: EnvelopeCache;
  private onEnvelopeFound?: (envelope: MessageEnvelope) => void;
  private onUntrusted?: (raw: string) => void;
  private onError?: (err: Error, context?: { raw?: string }) => void;
  private processedNodes = new WeakSet<Node>();

  constructor(config: ScannerEngineConfig) {
    this.contactDirectory = config.contactDirectory;
    this.envelopeCache = config.envelopeCache;
    this.onEnvelopeFound = config.onEnvelopeFound;
    this.onUntrusted = config.onUntrusted;
    this.onError = config.onError;
  }

  /* -------------------------------
   * Scan a single string
   * ------------------------------- */
  async scanText(text: string) {
    if (!text || typeof text !== "string") return;

    const lines = text.split(/\s+/);

    for (const line of lines) {
      if (!MessageEnvelope.isEnvelopeCandidate(line)) continue;

      try {
        const envelope = MessageEnvelope.fromMatchedString(line);

        // 1️⃣ Check cache first
        if (this.envelopeCache && (await this.envelopeCache.has(envelope))) {
          continue; // already processed
        }

        // 2️⃣ Check contact trust
        const isTrusted = this.contactDirectory.hasContactForEnvelope(envelope);
        if (!isTrusted) {
          this.onUntrusted?.(line);
          continue;
        }

        // 3️⃣ Check if contact is blocked
        const contact = this.contactDirectory.getContactByFingerprint(
          envelope.extractFingerprint()
        );
        if (contact?.isBlocked()) {
          this.onUntrusted?.(line);
          continue;
        }

        // 4️⃣ Call callback
        this.onEnvelopeFound?.(envelope);

        // 5️⃣ Store in cache
        await this.envelopeCache?.set(envelope);
      } catch (err: any) {
        if (err instanceof MessageEnvelopeError) {
          this.onUntrusted?.(err.raw ?? String(line));
        } else {
          this.onError?.(err, { raw: line });
        }
      }
    }
  }

  /* -------------------------------
   * Scan all text nodes under a DOM node
   * ------------------------------- */
  scanDOM(rootNode: Node) {
    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node: Node | null = walker.nextNode();
    while (node) {
      // Skip text nodes that belong to input-like elements to avoid collisions
      const parent = node.parentElement as HTMLElement | null;
      const isInputLike = parent
        ? ["INPUT", "TEXTAREA", "SELECT"].includes(parent.tagName) ||
          parent.isContentEditable
        : false;

      if (!isInputLike && !this.processedNodes.has(node)) {
        this.scanText(node.textContent ?? "");
        this.processedNodes.add(node);
      }
      node = walker.nextNode();
    }
  }

  /* -------------------------------
   * Observe DOM changes and scan dynamically
   * ------------------------------- */
  startDOMObserver(rootNode: Node) {
    if (this.observer) return; // already observing

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData" && mutation.target) {
          const targetNode = mutation.target as Node;
          const parent = (targetNode.parentElement as HTMLElement) || null;
          const isInputLike = parent
            ? ["INPUT", "TEXTAREA", "SELECT"].includes(parent.tagName) ||
              parent.isContentEditable
            : false;
          if (!isInputLike && !this.processedNodes.has(targetNode)) {
            this.scanText(targetNode.textContent ?? "");
            this.processedNodes.add(targetNode);
          }
        } else if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => this.scanDOM(node));
        }
      }
    });

    this.observer.observe(rootNode, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Initial scan
    this.scanDOM(rootNode);
  }

  stopDOMObserver() {
    this.observer?.disconnect();
    this.observer = undefined;
  }
}
