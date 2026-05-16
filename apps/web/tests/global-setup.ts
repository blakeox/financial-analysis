import type { FullConfig } from '@playwright/test';

const DEFAULT_TOKEN_URL = 'https://api.cloudflare.com/client/v4/oauth/token';
const DEFAULT_AUDIENCE = 'https://api.cloudflare.com/client/v4/';
const DEFAULT_API_BASE_URL = 'https://api.cloudflare.com/client/v4';

interface OAuthTokenResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

interface BrowserRenderingSessionResponse {
  success: boolean;
  errors: Array<{ message: string }>;
  result?: {
    ws_url?: string;
    session_id?: string;
    expires?: string;
  };
}

async function fetchAccessToken({
  clientId,
  clientSecret,
  audience,
  tokenUrl,
}: {
  clientId: string;
  clientSecret: string;
  audience: string;
  tokenUrl: string;
}): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    audience,
  });

  // Some providers expect credentials in both the Authorization header and request body for compatibility.
  body.set('client_id', clientId);
  body.set('client_secret', clientSecret);

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Failed to obtain Cloudflare OAuth access token (status ${response.status}): ${errorText}`
    );
  }

  const json = (await response.json()) as OAuthTokenResponse;
  if (!json.access_token) {
    throw new Error('Cloudflare OAuth response did not include an access_token.');
  }

  return json.access_token;
}

async function createBrowserRenderingSession({
  accessToken,
  accountId,
  apiBaseUrl,
  browser,
  sessionTtl,
}: {
  accessToken: string;
  accountId: string;
  apiBaseUrl: string;
  browser: string;
  sessionTtl: number;
}): Promise<{ wsEndpoint: string; sessionId?: string }> {
  const response = await fetch(
    `${apiBaseUrl}/accounts/${accountId}/workers/browser-rendering/sessions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        browser,
        ttl: sessionTtl,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Failed to create Cloudflare Browser Rendering session (status ${response.status}): ${errorText}`
    );
  }

  const json = (await response.json()) as BrowserRenderingSessionResponse;
  if (!json.success || !json.result?.ws_url) {
    const details = JSON.stringify(json.errors ?? [], null, 2);
    throw new Error(`Unexpected Browser Rendering session response from Cloudflare: ${details}`);
  }

  return {
    wsEndpoint: json.result.ws_url,
    sessionId: json.result.session_id,
  };
}

let hasWarnedAboutCredentials = false;

export async function ensureBrowserRenderingEndpoint(): Promise<string | undefined> {
  if (process.env.CLOUDFLARE_BROWSER_RENDERING_ENDPOINT) {
    return process.env.CLOUDFLARE_BROWSER_RENDERING_ENDPOINT;
  }

  const clientId = process.env.CLOUDFLARE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.CLOUDFLARE_OAUTH_CLIENT_SECRET;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!clientId || !clientSecret || !accountId) {
    if (!hasWarnedAboutCredentials) {
      console.warn(
        'Cloudflare OAuth credentials not fully configured; falling back to local browsers for Playwright tests.'
      );
      hasWarnedAboutCredentials = true;
    }
    return undefined;
  }

  const tokenUrl = process.env.CLOUDFLARE_OAUTH_TOKEN_URL ?? DEFAULT_TOKEN_URL;
  const audience = process.env.CLOUDFLARE_OAUTH_AUDIENCE ?? DEFAULT_AUDIENCE;
  const apiBaseUrl = process.env.CLOUDFLARE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const browser = process.env.CLOUDFLARE_BROWSER_RENDERING_BROWSER ?? 'chromium';
  const sessionTtl = Number(process.env.CLOUDFLARE_BROWSER_RENDERING_SESSION_TTL ?? '900');

  try {
    const accessToken = await fetchAccessToken({
      clientId,
      clientSecret,
      audience,
      tokenUrl,
    });

    const { wsEndpoint, sessionId } = await createBrowserRenderingSession({
      accessToken,
      accountId,
      apiBaseUrl,
      browser,
      sessionTtl,
    });

    process.env.CLOUDFLARE_BROWSER_RENDERING_ENDPOINT = wsEndpoint;
    if (sessionId) {
      process.env.CLOUDFLARE_BROWSER_RENDERING_SESSION_ID = sessionId;
    }

    console.info('✅ Cloudflare Browser Rendering session established via OAuth.');
    return wsEndpoint;
  } catch (error) {
    console.warn(
      `Unable to establish Cloudflare Browser Rendering session via OAuth (${(error as Error).message}). Tests will run locally.`
    );
    return undefined;
  }
}

export default async function globalSetup(_: FullConfig) {
  await ensureBrowserRenderingEndpoint();
}
