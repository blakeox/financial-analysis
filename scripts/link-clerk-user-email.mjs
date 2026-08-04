#!/usr/bin/env node

/**
 * Safely associate an additional email address with an existing Clerk user.
 *
 * Safe defaults:
 * - dry-run unless --apply is supplied;
 * - requires --confirm when applying;
 * - never creates users or marks an email verified;
 * - refuses ambiguous lookup results and cross-user collisions;
 * - emits masked email values only.
 */

const args = new Set(process.argv.slice(2));
const lookupEmail = readFlag('--lookup-email');
const targetEmail = readFlag('--email');
const apply = args.has('--apply');
const confirmed = args.has('--confirm');
const apiBaseUrl = (process.env.CLERK_API_BASE_URL || 'https://api.clerk.com/v1').replace(
  /\/$/,
  ''
);
const secretKey = process.env.CLERK_SECRET_KEY?.trim();

if (!lookupEmail || !targetEmail || !secretKey || (apply && !confirmed)) {
  console.error(
    'Usage: CLERK_SECRET_KEY=... node scripts/link-clerk-user-email.mjs --lookup-email=owner@example.com --email=alias@example.com [--apply --confirm]'
  );
  process.exit(2);
}

const normalizedLookupEmail = normalizeEmail(lookupEmail);
const normalizedTargetEmail = normalizeEmail(targetEmail);
if (normalizedLookupEmail === normalizedTargetEmail) {
  fail('Lookup and target email must be different.');
}

async function clerkRequest(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${secretKey}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { message: 'Clerk returned a non-JSON response.' };
  }

  if (!response.ok) {
    const error = new Error(`Clerk API ${response.status} ${response.statusText}`);
    error.details = body?.errors || body?.message || undefined;
    throw error;
  }
  return body;
}

async function findUsersByEmail(email) {
  const query = new URLSearchParams({ limit: '10' });
  query.append('email_address[]', email);
  const response = await clerkRequest(`/users?${query.toString()}`);
  return Array.isArray(response?.data) ? response.data : [];
}

function readFlag(name) {
  const value = process.argv.find((argument) => argument.startsWith(`${name}=`));
  return value ? value.slice(name.length + 1).trim() : undefined;
}

function normalizeEmail(value) {
  const normalized = String(value).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    fail(`Invalid email address supplied for ${value === lookupEmail ? 'lookup' : 'target'}.`);
  }
  return normalized;
}

function maskEmail(value) {
  const [local, domain] = value.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}

function userEmailAddresses(user) {
  return Array.isArray(user?.email_addresses)
    ? user.email_addresses
    : Array.isArray(user?.emailAddresses)
      ? user.emailAddresses
      : [];
}

function userOwnsEmail(user, email) {
  return userEmailAddresses(user).some((address) => {
    const value = address?.email_address ?? address?.emailAddress;
    return typeof value === 'string' && value.trim().toLowerCase() === email;
  });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const lookupMatches = await findUsersByEmail(normalizedLookupEmail);
if (lookupMatches.length !== 1) {
  fail(
    `Expected exactly one Clerk user for ${maskEmail(normalizedLookupEmail)}; found ${lookupMatches.length}.`
  );
}

const user = lookupMatches[0];
const userId = user?.id;
if (typeof userId !== 'string' || userId.length === 0) {
  fail('Clerk lookup returned a user without a stable ID.');
}

const targetMatches = await findUsersByEmail(normalizedTargetEmail);
const targetOwnedByUser = userOwnsEmail(user, normalizedTargetEmail);
if (targetMatches.some((match) => match?.id !== userId)) {
  fail(`Target email ${maskEmail(normalizedTargetEmail)} already belongs to another Clerk user.`);
}

let action = targetOwnedByUser ? 'already_linked' : apply ? 'added_unverified' : 'would_add_unverified';
if (apply && !targetOwnedByUser) {
  await clerkRequest('/email_addresses', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      email_address: normalizedTargetEmail,
      primary: false,
      verified: false,
    }),
  });
}

console.log(
  JSON.stringify(
    {
      schemaVersion: '1.0.0',
      kind: 'clerk-user-email-link',
      apply,
      confirmed,
      lookupEmail: maskEmail(normalizedLookupEmail),
      targetEmail: maskEmail(normalizedTargetEmail),
      userId,
      action,
      verified: false,
      verificationRequired: !targetOwnedByUser,
      next:
        'Complete Clerk email verification, then sign in through Microsoft with the verified address so Clerk can link the OAuth account. Do not create a second user.',
    },
    null,
    2
  )
);
