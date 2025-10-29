# Email Testing Guide - Trainer/Client Invitations

## 🔧 What Was Fixed

### Critical Bug Fixes
1. ✅ **Event names corrected**: Changed from `trainer_invitation` → `trainer.invitation` (and similar)
2. ✅ **Inviter name now included**: Fetches the actual inviter's profile and passes their name
3. ✅ **Correct templates for non-members**: Uses `join.*` templates with signup CTA for new users
4. ✅ **Email passed to join templates**: Enables pre-filled signup forms

### Code Changes
- **File**: `src/lib/sharingApi.ts`
- **Functions Modified**: `createTrainerInvite()`, `createClientInvite()`

---

## 🧪 Testing Plan

### Method 1: Email Test Page (Quick Template Testing)

**Access**: Navigate to `http://localhost:5173/email-test` (development only)

**What it tests**: Email template rendering and delivery

**Steps**:
1. Go to `/email-test`
2. Click each button to test individual templates:
   - ✉️ **Send Trainer Invitation** → Tests existing member invited as trainer
   - ✉️ **Send Client Invitation** → Tests existing member invited as client  
   - ✉️ **Send Join Trainer Invitation** → Tests non-member invited as trainer
   - ✉️ **Send Join Client Invitation** → Tests non-member invited as client

**Check Your Inbox**: Emails will be sent to `feasley@lassor.com`

**What to Verify**:
- ✅ Email subject line shows inviter name (not "John Smith" fallback)
- ✅ Email body shows inviter name correctly
- ✅ CTA link is correct:
  - **Member invites**: "Reply to request →" links to `/trainers`
  - **Join invites**: "Create account →" links to `/create-account?email=...&fromInvite=trainer`
- ✅ Green checkmark icon displays
- ✅ No template errors or "John Smith" defaults

---

### Method 2: End-to-End Flow Testing (Full Integration)

**Access**: Use the actual invitation flows in the app

#### Test Scenario A: Invite Existing User as Trainer

**Setup**:
- User A (trainer): Logged in
- User B (client): Has an account, email known

**Steps**:
1. Log in as User A
2. Navigate to Account → Sharing/Trainers section
3. Invite User B's email as a trainer
4. **Expected**: Email sent with event `trainer.invitation`

**Verify**:
- ✅ User B receives email
- ✅ Subject: "Become [User A's Name]'s trainer on Swiper"
- ✅ Body shows User A's actual first and last name
- ✅ CTA: "Reply to request →" → `https://www.swiper.fit/trainers`

---

#### Test Scenario B: Invite Non-Member as Trainer

**Setup**:
- User A (trainer): Logged in
- User C (client): Does NOT have an account

**Steps**:
1. Log in as User A  
2. Navigate to Account → Sharing/Trainers section
3. Invite User C's email (non-existent in database)
4. **Expected**: Email sent with event `join.trainer-invitation`

**Verify**:
- ✅ User C receives email
- ✅ Subject: "Join Swiper to become [User A's Name]'s trainer"
- ✅ Body shows User A's actual first and last name
- ✅ Body includes: "Swiper fit is the effortless way to log workouts..."
- ✅ CTA: "Create account →" → `https://www.swiper.fit/create-account?email=user-c@example.com&fromInvite=trainer`

---

#### Test Scenario C: Invite Existing User as Client

**Setup**:
- User D (client): Logged in
- User E (trainer): Has an account, email known

**Steps**:
1. Log in as User D
2. Navigate to Account → Sharing/Clients section
3. Invite User E's email as a client
4. **Expected**: Email sent with event `client.invitation`

**Verify**:
- ✅ User E receives email
- ✅ Subject: "Become [User D's Name]'s client on Swiper"
- ✅ Body shows User D's actual first and last name
- ✅ CTA: "Reply to request →" → `https://www.swiper.fit/trainers`

---

#### Test Scenario D: Invite Non-Member as Client

**Setup**:
- User D (client): Logged in
- User F (trainer): Does NOT have an account

**Steps**:
1. Log in as User D
2. Navigate to Account → Sharing/Clients section
3. Invite User F's email (non-existent in database)
4. **Expected**: Email sent with event `join.client-invitation`

**Verify**:
- ✅ User F receives email
- ✅ Subject: "Join Swiper to become [User D's Name]'s client"
- ✅ Body shows User D's actual first and last name
- ✅ Body includes: "Swiper fit is the effortless way to log workouts..."
- ✅ CTA: "Create account →" → `https://www.swiper.fit/create-account?email=user-f@example.com&fromInvite=client`

---

## 🐛 Common Issues to Check

### Issue: Email shows "John Smith" instead of real name
**Cause**: `inviter_name` not being passed or profile lookup failed  
**Check**: Browser console for errors in `createTrainerInvite` or `createClientInvite`

### Issue: Email doesn't arrive
**Cause**: Template name mismatch or Resend API error  
**Check**: 
- Browser Network tab for `/api/email/notify` response
- Vercel function logs for email API errors

### Issue: Wrong template used (login vs signup CTA)
**Cause**: Logic incorrectly determining member vs non-member  
**Check**: Console logs showing which branch was taken in `sharingApi.ts`

---

## 📊 Email Template Matrix

| Scenario | Event Name | Template | Subject | CTA Text | CTA Link |
|----------|-----------|----------|---------|----------|----------|
| Existing user → trainer | `trainer.invitation` | TrainerInvitation.js | "Become {name}'s trainer on Swiper" | "Reply to request →" | `/trainers` |
| New user → trainer | `join.trainer-invitation` | JoinTrainerInvitation.js | "Join Swiper to become {name}'s trainer" | "Create account →" | `/create-account?email=...&fromInvite=trainer` |
| Existing user → client | `client.invitation` | ClientInvitation.js | "Become {name}'s client on Swiper" | "Reply to request →" | `/trainers` |
| New user → client | `join.client-invitation` | JoinClientInvitation.js | "Join Swiper to become {name}'s client" | "Create account →" | `/create-account?email=...&fromInvite=client` |

---

## 🔍 Monitoring & Debugging

### Check Email Logs
**Production**: Check Resend dashboard for delivery status  
**Development**: Check browser console and network tab

### API Endpoint Logs
- Email send logs: `/api/email/notify` (api/email/notify.js)
- Look for: `Email API: Email sent successfully`

### Console Logs to Watch
```javascript
[createTrainerInvite] No user found, creating non-member invitation
[createTrainerInvite] User found, creating member invitation
[createClientInvite] No trainer found, creating non-member invitation
[createClientInvite] Trainer found, creating member invitation
```

---

## ✅ Acceptance Criteria

All emails should:
- [ ] Display the actual inviter's name (not "John Smith")
- [ ] Use correct subject line per scenario
- [ ] Show appropriate CTA based on member status
- [ ] Link to correct destination with proper query params
- [ ] Display the green checkmark icon
- [ ] Have clean formatting with no template errors

---

## 🚀 Quick Start

```bash
# 1. Start dev server (already running)
npm run dev

# 2. Open browser
http://localhost:5173/email-test

# 3. Click buttons and check feasley@lassor.com inbox

# 4. For full flow testing, navigate to:
http://localhost:5173/account
# Then use the Sharing/Trainers/Clients sections
```

---

## 📝 Notes

- Email test page only available in development and staging environments
- All test emails sent to: `feasley@lassor.com`
- Production emails require proper `RESEND_API_KEY` and `INTERNAL_API_SECRET` env vars
- Templates use React Email for rendering

