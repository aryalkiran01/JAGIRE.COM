/** Client-safe App User Connector popup helper. No secrets. */

export interface AppUserOAuthResult {
  success: boolean;
  connectorId: string;
  connectionAPIKey?: string;
  offlineAccessAllowed?: boolean;
  error?: string;
}

const OAUTH_MESSAGE_TYPE = "appUserConnectorOAuth";

export async function connectAppUser(opts: {
  connectorId: string;
  gatewayBaseUrl: string;
  start: (targetOrigin: string) => Promise<{ authorizationUrl: string }>;
}): Promise<AppUserOAuthResult> {
  const { connectorId, gatewayBaseUrl, start } = opts;
  const gatewayOrigin = new URL(gatewayBaseUrl).origin;
  const targetOrigin = window.location.origin;

  const popup = window.open("", "lovable-oauth", "width=600,height=720");
  if (!popup) return { success: false, connectorId, error: "Popup blocked. Allow popups and try again." };

  let authorizationUrl: string;
  try {
    authorizationUrl = (await start(targetOrigin)).authorizationUrl;
  } catch (e) {
    popup.close();
    return { success: false, connectorId, error: e instanceof Error ? e.message : "Failed to start OAuth" };
  }
  popup.location.href = authorizationUrl;

  return await new Promise<AppUserOAuthResult>((resolve) => {
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearInterval(timer);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== gatewayOrigin) return;
      const data = event.data;
      if (!data || data.type !== OAUTH_MESSAGE_TYPE || data.connector_id !== connectorId) return;
      cleanup();
      popup.close();
      if (data.success && data.offline_access_allowed === false) {
        resolve({ success: true, connectorId, offlineAccessAllowed: false });
        return;
      }
      if (data.success && data.api_key) {
        resolve({ success: true, connectorId, connectionAPIKey: data.api_key, offlineAccessAllowed: true });
        return;
      }
      resolve({ success: false, connectorId, error: data.error ?? "OAuth failed" });
    };
    window.addEventListener("message", onMessage);
    const timer = setInterval(() => {
      if (popup.closed) {
        cleanup();
        resolve({ success: false, connectorId, error: "Sign in was cancelled" });
      }
    }, 500);
  });
}