// Build Slack Block Kit payloads for known events

function asCode(text) {
  return '`' + String(text) + '`';
}

function header(text) {
  return { type: 'header', text: { type: 'plain_text', text, emoji: true } };
}

function sectionMarkdown(text) {
  return { type: 'section', text: { type: 'mrkdwn', text } };
}

function context(elements) {
  return { type: 'context', elements: elements.map((t) => ({ type: 'mrkdwn', text: String(t) })) };
}

function divider() {
  return { type: 'divider' };
}

export function formatEvent(eventKey, contextData = {}, data = {}) {
  const env = contextData.env || 'unknown';
  const requestId = contextData.request_id || contextData.correlation_id || '';

  const commonContext = [
    `env: ${asCode(env)}`,
    requestId ? `req: ${asCode(requestId)}` : null,
  ].filter(Boolean);

  switch (eventKey) {
    case 'raw':
      return {
        text: data?.text,
        blocks: data?.blocks,
      };

    case 'account.created':
      return {
        text: `Account created (${env})`,
        blocks: [
          header('🆕 Account Created'),
          sectionMarkdown(`• account: ${asCode(data.account_id)}\n• user: ${asCode(data.user_id)}${data.email ? `\n• email: ${asCode(data.email)}` : ''}`),
          divider(),
          context(commonContext),
        ],
      };

    case 'routine.created':
      return {
        text: `Routine created (${env})`,
        blocks: [
          header('📝 Routine Created'),
          sectionMarkdown(`• routine: ${asCode(data.routine_id)}\n• name: ${asCode(data.name)}\n• account: ${asCode(data.account_id)}\n• user: ${asCode(data.user_id)}`),
          divider(),
          context(commonContext),
        ],
      };

    case 'workout.started':
      return {
        text: `Workout started (${env})`,
        blocks: [
          header('🏁 Workout Started'),
          sectionMarkdown(`• workout: ${asCode(data.workout_id)}\n• account: ${asCode(data.account_id)}\n• user: ${asCode(data.user_id)}${data.routine_id ? `\n• routine: ${asCode(data.routine_id)}` : ''}`),
          divider(),
          context(commonContext),
        ],
      };

    case 'workout.ended':
      return {
        text: `Workout ended (${env})`,
        blocks: [
          header('🏁 Workout Ended'),
          sectionMarkdown([
            `• workout: ${asCode(data.workout_id)}`,
            `• account: ${asCode(data.account_id)}`,
            `• user: ${asCode(data.user_id)}`,
            data.routine_id ? `• routine: ${asCode(data.routine_id)}` : null,
            data.duration_sec != null ? `• duration: ${asCode(data.duration_sec)}s` : null,
            data.total_exercises != null ? `• exercises: ${asCode(data.total_exercises)}` : null,
            data.total_sets != null ? `• sets: ${asCode(data.total_sets)}` : null,
            data.status ? `• status: ${asCode(data.status)}` : null,
          ].filter(Boolean).join('\n')),
          divider(),
          context(commonContext),
        ],
      };

    case 'sharing.connected':
      return {
        text: `Shared account connected (${env})`,
        blocks: [
          header('🤝 Shared Account Connected'),
          sectionMarkdown([
            `• share: ${asCode(data.share_id)}`,
            `• from: ${asCode(data.from_account_id)}`,
            `• to: ${asCode(data.to_account_id)}`,
            `• granted_by: ${asCode(data.granted_by_user_id)}`,
            data.permissions ? `• perms: ${asCode(data.permissions)}` : null,
          ].filter(Boolean).join('\n')),
          divider(),
          context(commonContext),
        ],
      };

    case 'invitation.created':
      return {
        text: `Invitation created (${env})`,
        blocks: [
          header('✉️ Invitation Created'),
          sectionMarkdown([
            data.invitationId ? `• invitation: ${asCode(data.invitationId)}` : null,
            data.inviterId ? `• inviter: ${asCode(data.inviterId)}` : null,
            data.inviteeEmail ? `• invitee: ${asCode(data.inviteeEmail)}` : null,
            data.intendedRole ? `• role: ${asCode(data.intendedRole)}` : null,
          ].filter(Boolean).join('\n')),
          divider(),
          context(commonContext),
        ],
      };

    case 'invitation.email_send_failed':
    case 'invitation.email_request_exception':
      return {
        text: `Invitation email issue (${env})`,
        blocks: [
          header('🚨 Invitation Email Failure'),
          sectionMarkdown([
            `• event: ${asCode(eventKey.split('.').pop())}`,
            data.to ? `• to: ${asCode(data.to)}` : null,
            data.event ? `• template: ${asCode(data.event)}` : null,
            data.status ? `• status: ${asCode(data.status)}` : null,
            data.error ? `• error: ${asCode(data.error)}` : null,
          ].filter(Boolean).join('\n')),
          divider(),
          context(commonContext),
        ],
      };

    case 'invitation.error':
    case 'invitation.accept.error':
      return {
        text: `Invitation error (${env})`,
        blocks: [
          header('⚠️ Invitation Error'),
          sectionMarkdown([
            data.stage ? `• stage: ${asCode(data.stage)}` : null,
            data.request_id ? `• request: ${asCode(data.request_id)}` : null,
            data.source ? `• source: ${asCode(data.source)}` : null,
            data.reason ? `• reason: ${asCode(data.reason)}` : null,
            data.error ? `• error: ${asCode(data.error)}` : null,
          ].filter(Boolean).join('\n')),
          divider(),
          context(commonContext),
        ],
      };

    case 'routine.copied_from_share':
      return {
        text: `Routine copied via share (${env})`,
        blocks: [
          header('📋 Routine Copied (Share)'),
          sectionMarkdown([
            `• source_routine: ${asCode(data.source_routine_id)}`,
            `• new_routine: ${asCode(data.new_routine_id)}`,
            `• from_account: ${asCode(data.source_account_id)}`,
            `• to_account: ${asCode(data.target_account_id)}`,
            `• user: ${asCode(data.user_id)}`,
            data.source_routine_name ? `• source_name: ${asCode(data.source_routine_name)}` : null,
            data.new_routine_name ? `• new_name: ${asCode(data.new_routine_name)}` : null,
          ].filter(Boolean).join('\n')),
          divider(),
          context(commonContext),
        ],
      };

    default:
      return {
        text: `${eventKey} (${env})`,
        blocks: [
          header(`🔔 ${eventKey}`),
          sectionMarkdown('```\n' + JSON.stringify({ context: contextData, data }, null, 2) + '\n```'),
          divider(),
          context(commonContext),
        ],
      };
  }
}


