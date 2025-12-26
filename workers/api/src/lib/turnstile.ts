import type { Env } from '../types';

export type TurnstileSiteVerifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  'error-codes'?: string[];
};

export type TurnstileVerificationOutcome =
  | { status: 'SKIP' }
  | { status: 'PASS'; raw: TurnstileSiteVerifyResponse }
  | { status: 'FAIL'; raw: TurnstileSiteVerifyResponse };

export function getTurnstileTokenFromRequest(request: Request): string | undefined {
  return (
    request.headers.get('CF-Turnstile-Token') ||
    request.headers.get('X-Turnstile-Token') ||
    request.headers.get('CF-Turnstile-Response') ||
    request.headers.get('X-Turnstile-Response') ||
    undefined
  );
}

export async function verifyTurnstileToken(
  env: Env,
  token: string | undefined,
  remoteIp?: string
): Promise<TurnstileVerificationOutcome> {
  const secret = env.TURNSTILE_SECRET;
  if (!secret) return { status: 'SKIP' };
  if (!token) return { status: 'FAIL', raw: { success: false, 'error-codes': ['missing-input-response'] } };

  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  if (remoteIp) form.set('remoteip', remoteIp);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });

  let payload: TurnstileSiteVerifyResponse;
  try {
    payload = (await res.json()) as TurnstileSiteVerifyResponse;
  } catch {
    payload = { success: false, 'error-codes': ['invalid-json'] };
  }

  if (payload.success) return { status: 'PASS', raw: payload };
  return { status: 'FAIL', raw: payload };
}
