// ---------------------------------------------------------------------------
// Server public key loader
// ---------------------------------------------------------------------------
//
// Centralizes where the ECIES recipient key comes from. Today it's a
// constant; tomorrow it can be an API call. Callers don't care.
// ---------------------------------------------------------------------------

// The key is cached for the page lifetime — fetch once, reuse everywhere.
let cached: Promise<string> | null = null;

/**
 * Returns the server's secp256k1 ECDH public key, base64url encoded.
 * Cached after the first call.
 */
export function getServerPublicKey(): Promise<string> {
  if (!cached) {
    cached = loadServerPublicKey();
  }
  return cached;
}

/**
 * The actual source of the key. Swap this implementation to point at
 * an API endpoint without touching any caller.
 */
async function loadServerPublicKey(): Promise<string> {
  // Today: hardcoded constant.
  return "9mbAwtl9mwX6TLslgGcJ7PXDSNK6AEH8OA7q8Jr/M8pj";

  // Tomorrow, when you're ready:
  //
  // const res = await fetch("https://api.dcp.tc-sa.com/api/crypto/server-pubkey");
  // if (!res.ok) throw new Error(`Failed to fetch server pubkey: HTTP ${res.status}`);
  // const { publicKey } = await res.json();
  // return publicKey;
}