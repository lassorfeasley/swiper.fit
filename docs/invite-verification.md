# Invitation Flow Smoke Test

Use this checklist after deploying any sharing changes to ensure pending cards clear correctly.

1. **Send trainer invite**
   - Log in as account **A**.
   - Open Account → Sharing requests → “Invite a trainer”.
   - Invite account **B** (existing user). Confirm toast.
   - Verify Account A shows the new outgoing card.

2. **Accept invite**
   - Log in as account **B** (or use `/accept-invite?token=...` from the email).
   - Accept the invite.
   - Confirm Account B now lists account A under “Clients”.

3. **Verify outgoing list clears**
   - Refresh Account A.
   - Expected: the outgoing card disappears entirely.

4. **Decline flow (optional)**
   - Repeat steps 1–2 but decline the invite instead of accepting.
   - Expected: no pending cards remain for either account.

**Reminder:** The database now rejects `account_shares` inserts where `request_type` is `trainer_invite`/`client_invite` and `status='pending'`. All pending cards must come from the `invitations` table. If any legacy card appears, capture the inviter id + invitation id, run `supabase/scripts/final_cleanup_pending_invites.sql`, and open a bug before shipping.

## Dual-direction invitations

1. From Account **A**, open “Invite someone to manage you”, toggle **“Also invite them to let me manage them”**, and send the invite.
2. Confirm Account A now shows **two** outgoing cards (one for each direction).
3. Log in as Account **B** and accept just one of the cards—Account A should now show only the remaining pending card.
4. Accept the second card and confirm both relationships appear in Account A’s “Trainers” and Account B’s “Clients”.

