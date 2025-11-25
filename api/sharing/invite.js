import { getSupabaseServerClient } from '../../server/supabase.js';

class InviteApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const supabaseAdmin = getSupabaseServerClient();
const fallbackSiteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.swiper.fit';
const SITE_URL = process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl;
const EMAIL_ENDPOINT_BASE = process.env.INTERNAL_EMAIL_BASE_URL || SITE_URL;

const ALLOWED_ROLES = new Set(['manager', 'managed']);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (req.method === 'POST') {
      const auth = await authenticateRequest(req);
      return await handleCreateInvite(req, res, auth);
    }

    if (req.method === 'GET') {
      const auth = await authenticateRequest(req);
      return await handleListInvites(req, res, auth);
    }

    if (req.method === 'DELETE') {
      const auth = await authenticateRequest(req);
      return await handleDeleteInvite(req, res, auth);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (error instanceof InviteApiError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('[Invite API] Unexpected error', error);
    return res.status(500).json({
      error: 'Unexpected server error',
      details: error?.message || 'Unknown error',
    });
  }
}

async function authenticateRequest(req) {
  const token = extractBearerToken(req.headers.authorization || '');
  if (!token) {
    throw new InviteApiError(401, 'Missing Authorization token');
  }
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) {
    throw new InviteApiError(401, 'Invalid or expired access token');
  }
  return { token, user: authData.user };
}

async function handleCreateInvite(req, res, auth) {
  const inviterId = auth.user.id;
  const inviterEmail = (auth.user.email || '').toLowerCase();
  const inviterProfile = await fetchInviterProfile(inviterId);
  const inviterName =
    [inviterProfile?.first_name, inviterProfile?.last_name].filter(Boolean).join(' ').trim() ||
    inviterEmail ||
    'Swiper member';

  const { inviteeEmail, intendedRole, permissions = {} } = req.body || {};

  if (!inviteeEmail || typeof inviteeEmail !== 'string') {
    return res.status(400).json({ error: 'inviteeEmail is required' });
  }

  const normalizedEmail = inviteeEmail.trim().toLowerCase();
  if (!isEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'A valid inviteeEmail is required' });
  }

  if (!ALLOWED_ROLES.has(intendedRole)) {
    return res.status(400).json({ error: 'intendedRole must be manager or managed' });
  }

  if (normalizedEmail === inviterEmail) {
    return res.status(400).json({ error: 'You cannot invite yourself' });
  }

  const sanitizedPermissions = {
    can_create_routines: !!permissions?.can_create_routines,
    can_start_workouts: !!permissions?.can_start_workouts,
    can_review_history: !!permissions?.can_review_history,
  };

  const existingRecipient = await fetchProfileByEmail(normalizedEmail);
  await assertNoActiveShare({
    intendedRole,
    inviterId,
    recipientId: existingRecipient?.id || null,
  });
  await assertNoDuplicatePendingInvite({
    intendedRole,
    inviterId,
    recipientEmail: normalizedEmail,
  });

  const { data: newInvitation, error: insertError } = await supabaseAdmin
    .from('invitations')
    .insert({
      inviter_id: inviterId,
      recipient_email: normalizedEmail,
      recipient_user_id: existingRecipient?.id || null,
      intended_role: intendedRole,
      permissions: sanitizedPermissions,
    })
    .select('id, token, expires_at')
    .single();

  if (insertError) {
    console.error('[Invite API] Failed to create invitation', insertError);
    return res.status(500).json({ error: 'Failed to create invitation' });
  }

  const eventKey = resolveEmailEvent({ intendedRole, hasAccount: !!existingRecipient });
  const acceptUrl = buildAcceptUrl(newInvitation.token);

  await sendInviteEmail({
    event: eventKey,
    to: normalizedEmail,
    inviterName,
    acceptUrl,
  });

  return res.status(200).json({
    ok: true,
    invitationId: newInvitation.id,
    expiresAt: newInvitation.expires_at,
  });
}

async function handleListInvites(req, res, auth) {
  const scope = String(req.query?.scope || 'outgoing').toLowerCase();
  if (scope === 'outgoing') {
    const invitations = await fetchOutgoingInvitations(auth.user.id);
    return res.status(200).json({ ok: true, invitations });
  }

  if (scope === 'incoming') {
    const invitations = await fetchIncomingInvitations(auth.user);
    return res.status(200).json({ ok: true, invitations });
  }

  throw new InviteApiError(400, 'Unknown invitations scope');
}

async function handleDeleteInvite(req, res, auth) {
  const invitationId = String(req.query?.id || req.body?.id || '').trim();
  if (!invitationId) {
    throw new InviteApiError(400, 'Invitation id is required');
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('invitations')
    .select('id')
    .eq('id', invitationId)
    .eq('inviter_id', auth.user.id)
    .maybeSingle();

  if (fetchError) {
    console.error('[Invite API] Failed to look up invitation for deletion', fetchError);
    throw new InviteApiError(500, 'Failed to delete invitation');
  }

  if (!existing) {
    throw new InviteApiError(404, 'Invitation not found');
  }

  const { error: deleteError } = await supabaseAdmin
    .from('invitations')
    .delete()
    .eq('id', invitationId);

  if (deleteError) {
    console.error('[Invite API] Failed to delete invitation', deleteError);
    throw new InviteApiError(500, 'Failed to delete invitation');
  }

  return res.status(200).json({ ok: true });
}

async function fetchInviterProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Invite API] Failed to fetch inviter profile', error);
    return null;
  }

  return data;
}

async function fetchProfileByEmail(email) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('email', email)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[Invite API] Failed to look up profile by email', error);
    throw new InviteApiError(500, 'Failed to look up user by email');
  }

  return data || null;
}

async function fetchProfilesByIds(ids = []) {
  if (!ids.length) return new Map();
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('id', ids);

  if (error) {
    console.error('[Invite API] Failed to fetch profiles by ids', error);
    throw new InviteApiError(500, 'Failed to fetch profiles');
  }

  return new Map((data || []).map((profile) => [profile.id, profile]));
}

async function fetchProfilesByEmails(emails = []) {
  if (!emails.length) return new Map();
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('email', emails);

  if (error) {
    console.error('[Invite API] Failed to fetch profiles by emails', error);
    throw new InviteApiError(500, 'Failed to fetch profiles');
  }

  return new Map((data || []).map((profile) => [profile.email?.toLowerCase(), profile]));
}

function normalizeProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id || null,
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    email: profile.email || '',
  };
}

async function fetchOutgoingInvitations(inviterId) {
  const { data, error } = await supabaseAdmin
    .from('invitations')
    .select('id, recipient_email, recipient_user_id, intended_role, status, expires_at, created_at, permissions')
    .eq('inviter_id', inviterId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Invite API] Failed to fetch outgoing invitations', error);
    throw new InviteApiError(500, 'Failed to fetch outgoing invitations');
  }

  const recipientIds = Array.from(
    new Set(
      (data || [])
        .map((invite) => invite.recipient_user_id)
        .filter(Boolean),
    ),
  );
  const profilesById = await fetchProfilesByIds(recipientIds);

  const emailsNeedingProfiles = Array.from(
    new Set(
      (data || [])
        .filter((invite) => !invite.recipient_user_id)
        .map((invite) => invite.recipient_email),
    ),
  );
  const profilesByEmail = await fetchProfilesByEmails(emailsNeedingProfiles);

  return (data || []).map((invite) => {
    const profile =
      normalizeProfile(
        invite.recipient_user_id
          ? profilesById.get(invite.recipient_user_id)
          : profilesByEmail.get(invite.recipient_email),
      ) || null;

    return {
      ...invite,
      recipient_profile: profile,
    };
  });
}

async function fetchIncomingInvitations(user) {
  const nowIso = new Date().toISOString();

  const [byUserId, byEmail] = await Promise.all([
    supabaseAdmin
      .from('invitations')
      .select('id, token, inviter_id, recipient_email, intended_role, status, expires_at, created_at, permissions')
      .eq('recipient_user_id', user.id)
      .eq('status', 'pending')
      .gt('expires_at', nowIso),
    user.email
      ? supabaseAdmin
          .from('invitations')
          .select('id, token, inviter_id, recipient_email, intended_role, status, expires_at, created_at, permissions')
          .is('recipient_user_id', null)
          .eq('recipient_email', user.email.toLowerCase())
          .eq('status', 'pending')
          .gt('expires_at', nowIso)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (byUserId.error) {
    console.error('[Invite API] Failed to fetch user-bound invitations', byUserId.error);
    throw new InviteApiError(500, 'Failed to fetch invitations');
  }

  if (byEmail.error) {
    console.error('[Invite API] Failed to fetch email-bound invitations', byEmail.error);
    throw new InviteApiError(500, 'Failed to fetch invitations');
  }

  const combinedMap = new Map();
  for (const dataset of [byUserId.data || [], byEmail.data || []]) {
    dataset.forEach((invite) => {
      combinedMap.set(invite.id, invite);
    });
  }

  const invitations = Array.from(combinedMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const inviterIds = Array.from(new Set(invitations.map((invite) => invite.inviter_id)));
  const inviterProfiles = await fetchProfilesByIds(inviterIds);

  return invitations.map((invite) => ({
    ...invite,
    inviter_profile: normalizeProfile(inviterProfiles.get(invite.inviter_id)),
  }));
}

async function assertNoActiveShare({ intendedRole, inviterId, recipientId }) {
  if (!recipientId) {
    return;
  }

  const ownerId = intendedRole === 'manager' ? recipientId : inviterId;
  const delegateId = intendedRole === 'manager' ? inviterId : recipientId;

  const { count, error } = await supabaseAdmin
    .from('account_shares')
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', ownerId)
    .eq('delegate_user_id', delegateId)
    .eq('status', 'active')
    .is('revoked_at', null);

  if (error) {
    console.error('[Invite API] Failed to check existing shares', error);
    throw new Error('Failed to check existing sharing relationship');
  }

  if ((count || 0) > 0) {
    throw new InviteApiError(409, 'An active sharing relationship already exists with this user');
  }
}

async function assertNoDuplicatePendingInvite({ intendedRole, inviterId, recipientEmail }) {
  const { count, error } = await supabaseAdmin
    .from('invitations')
    .select('id', { count: 'exact', head: true })
    .eq('inviter_id', inviterId)
    .eq('recipient_email', recipientEmail)
    .eq('intended_role', intendedRole)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());

  if (error) {
    console.error('[Invite API] Failed to check duplicate invitations', error);
    throw new InviteApiError(500, 'Failed to check duplicate invitations');
  }

  if ((count || 0) > 0) {
    throw new InviteApiError(409, 'A pending invitation already exists for this email');
  }
}

function resolveEmailEvent({ intendedRole, hasAccount }) {
  if (intendedRole === 'manager') {
    return hasAccount ? 'client.invitation' : 'join.client-invitation';
  }
  return hasAccount ? 'trainer.invitation' : 'join.trainer-invitation';
}

async function sendInviteEmail({ event, to, inviterName, acceptUrl }) {
  try {
    const payload = {
      event,
      to,
      data: {
        inviter_name: inviterName,
        cta_url: acceptUrl,
      },
      context: {
        source: 'server-invite-api',
      },
    };

    const result = await fetch(`${EMAIL_ENDPOINT_BASE}/api/email/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.INTERNAL_API_SECRET
          ? { 'x-internal-secret': process.env.INTERNAL_API_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!result.ok) {
      const errorBody = await result.text();
      console.error('[Invite API] Email send failed', result.status, errorBody);
    }
  } catch (err) {
    console.error('[Invite API] Email request failed', err);
  }
}

function buildAcceptUrl(token) {
  const url = new URL('/accept-invite', SITE_URL);
  url.searchParams.set('token', token);
  return url.toString();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function extractBearerToken(headerValue) {
  if (!headerValue) return '';
  const parts = headerValue.split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return headerValue;
}

