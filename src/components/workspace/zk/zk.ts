import { secp256k1 } from '@noble/curves/secp256k1.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HKDF_HASH = "SHA-256" as const;
const MASTER_KEY_INFO = "dcp-master-key-v1";
const SESSION_KEY_INFO = "chat-session-aes-v1";
const MASTER_KEY_LENGTH_BITS = 256;
const AES_KEY_LENGTH_BITS = 256;
const WRAP_INFO = "dcp-key-wrap-v1";

export const FIXED_PRF_SALT: Uint8Array<ArrayBuffer> =
  new TextEncoder().encode("dcp-prf-master-v1");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MasterKeyBytes = Uint8Array<ArrayBuffer> & { readonly __brand: "MasterKeyBytes" };
export type SessionId = string & { readonly __brand: "SessionId" };
export type KeyPurpose = string & { readonly __brand: "KeyPurpose" };

export interface WrappedKeyPayload {
  /** Ephemeral ECDH public key, base64url (65 bytes raw uncompressed). */
  epk: string;
  /** AES-GCM IV, base64url (12 bytes). */
  iv: string;
  /** Wrapped key bytes, base64url. */
  wrapped: string;
}


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const textEncoder = new TextEncoder();

// (or import from your shared utils)
const b64dec = (s: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(
    atob(s.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0),
  );

export const b64enc = (b: BufferSource): string => {
  const bytes =
    b instanceof ArrayBuffer
      ? new Uint8Array(b)
      : new Uint8Array(b.buffer, b.byteOffset, b.byteLength);

  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

// ---------------------------------------------------------------------------
// Step 0: credential -> master key (one biometric prompt per page lifetime)
// ---------------------------------------------------------------------------

export async function initializeMasterKey(): Promise<MasterKeyBytes> {
  const credentialId = localStorage.getItem("dcp_credential_id");
  if (!credentialId) {
    throw new Error("No credential on file. Please log in again.");
  }

  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ id: b64dec(credentialId), type: "public-key" }],
      // userVerification: "required",
      extensions: { prf: { eval: { first: FIXED_PRF_SALT } } },
			rpId: "tc-sa.com",
			timeout: 300000
    },
  })) as PublicKeyCredential | null;

  if (!assertion) throw new Error("PRF prompt was cancelled.");

  const first = assertion.getClientExtensionResults().prf?.results?.first;
  if (!first) throw new Error("Authenticator did not return a PRF result.");

  return deriveMasterKey(first);
}

// ---------------------------------------------------------------------------
// Step 1: PRF output -> master key
// ---------------------------------------------------------------------------

export async function deriveMasterKey(
  prfOutput: BufferSource,
): Promise<MasterKeyBytes> {
  const bytes =
    prfOutput instanceof ArrayBuffer
      ? new Uint8Array(prfOutput)
      : new Uint8Array(prfOutput.buffer, prfOutput.byteOffset, prfOutput.byteLength);

  if (bytes.byteLength !== 32) {
    throw new Error(`Expected 32-byte PRF output, got ${bytes.byteLength} bytes.`);
  }

  const ikm: CryptoKey = await crypto.subtle.importKey(
    "raw",
    bytes,
    "HKDF",
    false,
    ["deriveBits"],
  );

  const bits: ArrayBuffer = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: HKDF_HASH,
      salt: new Uint8Array(0),
      info: textEncoder.encode(MASTER_KEY_INFO),
    },
    ikm,
    MASTER_KEY_LENGTH_BITS,
  );

  return new Uint8Array(bits) as MasterKeyBytes;
}

// ---------------------------------------------------------------------------
// Step 2: master key + sessionId -> per-session AES key
// ---------------------------------------------------------------------------

export async function deriveSessionKey(
  masterKey: MasterKeyBytes,
  sessionId: SessionId,
  purpose: KeyPurpose = SESSION_KEY_INFO as KeyPurpose,
): Promise<CryptoKey> {
  const ikm: CryptoKey = await crypto.subtle.importKey(
    "raw",
    masterKey,
    "HKDF",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: HKDF_HASH,
      salt: textEncoder.encode(sessionId),
      info: textEncoder.encode(purpose),
    },
    ikm,
    { name: "AES-GCM", length: AES_KEY_LENGTH_BITS },
    true,
    ["encrypt", "decrypt"],
  );
}

// ---------------------------------------------------------------------------
// Branding helpers
// ---------------------------------------------------------------------------

export function asSessionId(value: string): SessionId {
  if (!value) throw new Error("SessionId must be non-empty.");
  return value as SessionId;
}

export function asKeyPurpose(value: string): KeyPurpose {
  if (!value) throw new Error("KeyPurpose must be non-empty.");
  return value as KeyPurpose;
}

//
// UI section
//

let cached: MasterKeyBytes | null = null;
let inFlight: Promise<MasterKeyBytes> | null = null;

/**
 * Returns the master key, prompting for biometric on first call.
 * Safe to call from anywhere — dedupes concurrent calls.
 */
export async function requireMasterKey(): Promise<MasterKeyBytes> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = initializeMasterKey()
    .then((k) => {
      cached = k;
      return k;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function clearMasterKey(): void {
  cached = null;
  inFlight = null;
}

// ---------------------------------------------------------------------------
// Session key cache (per sessionId, per page lifetime)
// ---------------------------------------------------------------------------

const sessionKeyCache = new Map<SessionId, Promise<CryptoKey>>();

/**
 * Returns the AES key for a session, deriving it from the master key on
 * first call and caching it for the lifetime of the page.
 *
 * Safe to call from anywhere — dedupes concurrent calls for the same session.
 */
export function getSessionKey(sessionId: SessionId): Promise<CryptoKey> {
  const cached = sessionKeyCache.get(sessionId);
  if (cached) return cached;

  const promise = requireMasterKey().then((mk) => deriveSessionKey(mk, sessionId));
  sessionKeyCache.set(sessionId, promise);
  return promise;
}

export function clearSessionKeys(): void {
  sessionKeyCache.clear();
}

//
//  Cipher
//
const IV_LENGTH = 12; // 96 bits, standard for AES-GCM

export async function encryptMessage(
  sessionId: SessionId,
  plaintext: string,
): Promise<string> {
  const key = await getSessionKey(sessionId);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plaintext),
    ),
  );

  // Flatten: iv || ct (WebCrypto already appends the 16-byte tag to ct)
  const envelope = new Uint8Array(IV_LENGTH + ct.length);
  envelope.set(iv, 0);
  envelope.set(ct, IV_LENGTH);

  return b64enc(envelope);
}

export async function decryptMessage(
  sessionId: SessionId,
  envelopeB64: string,
): Promise<string> {
  const envelope = b64dec(envelopeB64);
  const iv = envelope.slice(0, IV_LENGTH);
  const ct = envelope.slice(IV_LENGTH);

  const key = await getSessionKey(sessionId);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ct,
  );
  return new TextDecoder().decode(plaintext);
}

// ---------------------------------------------------------------------------
// Wrap an AES key with the server's public key
// ---------------------------------------------------------------------------

/**
 * Wraps a raw AES key for the server using ECIES-style hybrid encryption.
 *
 * @param serverPublicKeyB64 - Server's P-256 ECDH public key, base64url raw
 *                             (65 bytes, uncompressed point).
 * @param keyToWrap          - The raw AES key bytes (typically 32 bytes).
 * @returns Payload to send to the server.
 */
export async function wrapKeyForServer(
  serverPublicKeyB64: string,
  keyToWrap: Uint8Array<ArrayBuffer>,
): Promise<string> {
  const serverPubBytes = b64dec(serverPublicKeyB64); // 65 bytes, uncompressed

  const ephemeralPriv = secp256k1.utils.randomSecretKey();
  const ephemeralPub = secp256k1.getPublicKey(ephemeralPriv, false); // 65 bytes ← was true

  const sharedPoint = secp256k1.getSharedSecret(ephemeralPriv, serverPubBytes, false);
  const sharedSecret = sharedPoint.slice(1, 33); // x-only, 32 bytes

  const aesKey = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  const nonce = crypto.getRandomValues(new Uint8Array(16)); // ← was 12

  const ctAndTag = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, keyToWrap),
  );
  const ct = ctAndTag.slice(0, ctAndTag.length - 16);
  const tag = ctAndTag.slice(ctAndTag.length - 16);

  // Layout: pubkey(65) || nonce(16) || tag(16) || ct
  const envelope = new Uint8Array(65 + 16 + 16 + ct.length);
  envelope.set(ephemeralPub, 0);
  envelope.set(nonce, 65);
  envelope.set(tag, 81);
  envelope.set(ct, 97);

  return b64enc(envelope);
}