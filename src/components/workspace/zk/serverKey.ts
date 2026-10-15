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
	// 9mbAwtl9mwX6TLslgGcJ7PXDSNK6AEH8OA7q8Jr/M8pj
	// 0412a630570840f79b3206de9203837c68dba7c3813cc61a6d54cde91d09f80ff666c0c2d97d9b05fa4cbb25806709ecf5c348d2ba0041fc380eeaf09aff33ca63
	// 0312a630570840f79b3206de9203837c68dba7c3813cc61a6d54cde91d09f80ff6
  return "AxKmMFcIQPebMgbekgODfGjbp8OBPMYabVTN6R0J+A/2";

  // Tomorrow, when you're ready:
  //
  // const res = await fetch("https://api.dcp.tc-sa.com/api/crypto/server-pubkey");
  // if (!res.ok) throw new Error(`Failed to fetch server pubkey: HTTP ${res.status}`);
  // const { publicKey } = await res.json();
  // return publicKey;
}