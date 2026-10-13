// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HKDF_HASH = "SHA-256" as const;
const MASTER_KEY_INFO = "dcp-master-key-v1";
const SESSION_KEY_INFO = "chat-session-aes-v1";
const MASTER_KEY_LENGTH_BITS = 256;
const AES_KEY_LENGTH_BITS = 256;
const ECDH_CURVE = "P-256" as const;
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
      userVerification: "required",
      extensions: { prf: { eval: { first: FIXED_PRF_SALT } } },
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
    false,
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

export interface EncryptedPayload {
  iv: string;         // base64url
  ciphertext: string; // base64url
}

export async function encryptMessage(
  sessionId: SessionId,
  plaintext: string,
): Promise<EncryptedPayload> {
  const key = await getSessionKey(sessionId);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return {
    iv: b64enc(iv),
    ciphertext: b64enc(new Uint8Array(ciphertext)),
  };
}

export async function decryptMessage(
  sessionId: SessionId,
  payload: EncryptedPayload,
): Promise<string> {
  const key = await getSessionKey(sessionId);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64dec(payload.iv) },
    key,
    b64dec(payload.ciphertext),
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
): Promise<WrappedKeyPayload> {
  // 1. Import the server's public key
  const serverPubKey = await crypto.subtle.importKey(
    "raw",
    b64dec(serverPublicKeyB64),
    { name: "ECDH", namedCurve: ECDH_CURVE },
    false,
    [],
  );

  // 2. Generate an ephemeral keypair for this wrap operation
  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: ECDH_CURVE },
    true, // extractable so we can export the public key
    ["deriveBits"],
  );

  // 3. ECDH: derive shared secret between ephemeral private + server public
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: serverPubKey },
    ephemeral.privateKey,
    256, // P-256 → 32 bytes
  );

  // 4. HKDF the shared secret into an AES-GCM key-encryption key (KEK)
  const kekIkm = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    "HKDF",
    false,
    ["deriveKey"],
  );

  const kek = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: HKDF_HASH,
      salt: new Uint8Array(0),
      info: textEncoder.encode(WRAP_INFO),
    },
    kekIkm,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  // 5. Wrap the AES key with AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const wrapped = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    kek,
    keyToWrap,
  );

  // 6. Export the ephemeral public key (raw uncompressed, 65 bytes)
  const epkRaw = await crypto.subtle.exportKey("raw", ephemeral.publicKey);

  return {
    epk: b64enc(epkRaw),
    iv: b64enc(iv),
    wrapped: b64enc(new Uint8Array(wrapped)),
  };
}