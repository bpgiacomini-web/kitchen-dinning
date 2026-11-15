/**
 * Authenticated cloud dataset adapter for the isolated Metro Eats architecture preview.
 * The caller must supply a token getter from the real Neon Auth session; this module
 * deliberately has no anonymous fallback and never accepts an owner/user ID.
 */
export function createUserDatasetClient({
  getAccessToken,
  fetchImpl = globalThis.fetch,
  endpoint = "/api/user-data"
} = {}) {
  if (typeof getAccessToken !== "function") throw new TypeError("getAccessToken is required");
  if (typeof fetchImpl !== "function") throw new TypeError("fetch is required");

  async function request(method, body) {
    const token = await getAccessToken();
    if (typeof token !== "string" || !token.trim()) {
      const error = new Error("Sign in is required to access cloud storage.");
      error.code = "AUTH_REQUIRED";
      throw error;
    }
    const response = await fetchImpl(endpoint, {
      method,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || `Cloud dataset request failed (${response.status}).`);
      error.status = response.status;
      error.code = response.status === 409 ? "REVISION_CONFLICT" : response.status === 401 ? "AUTH_REQUIRED" : "CLOUD_ERROR";
      error.revision = Number.isSafeInteger(payload.revision) ? payload.revision : undefined;
      throw error;
    }
    return payload;
  }

  return {
    async load() {
      const result = await request("GET");
      if (!result.data || !Number.isSafeInteger(result.revision) || result.revision < 0) {
        throw new Error("Cloud dataset response was invalid.");
      }
      return { data: result.data, revision: result.revision };
    },
    async save(data, expectedRevision) {
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
        throw new TypeError("expectedRevision must be a nonnegative integer");
      }
      const result = await request("PUT", { data, expectedRevision });
      if (result.ok !== true || !Number.isSafeInteger(result.revision)) {
        throw new Error("Cloud save was not confirmed by the server.");
      }
      return { revision: result.revision };
    }
  };
}
