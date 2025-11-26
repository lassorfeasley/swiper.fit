# Extract Custom Hooks for Account Data Fetching

## Goal
Extract React Query logic and utility functions from Account components into reusable custom hooks to improve maintainability, reusability, and testability.

## Proposed Hooks

### 1. `src/hooks/useFormatUserDisplay.ts`
- **Purpose:** Centralize user name formatting logic.
- **Logic:** Check first/last name, fallback to email.
- **Usage:** `Account.tsx`, `SharingRequests.tsx`, `TrainersList.tsx`, `ClientsList.tsx`.

### 2. `src/features/account/hooks/usePendingInvitations.ts`
- **Purpose:** Fetch incoming invitations.
- **Logic:** `useQuery` calling `getPendingInvitations`.
- **Usage:** `SharingRequests.tsx`.

### 3. `src/features/account/hooks/useOutgoingInvitations.ts`
- **Purpose:** Fetch and format outgoing invitations.
- **Logic:** `useQuery` calling `getOutgoingInvitations` + `mapTokenOutgoingInvitation`.
- **Usage:** `SharingRequests.tsx`.

### 4. `src/features/account/hooks/useTrainerShares.ts`
- **Purpose:** Fetch active trainers (owners).
- **Logic:** `useQuery` fetching `account_shares` + `profiles`.
- **Usage:** `TrainersList.tsx`.

### 5. `src/features/account/hooks/useClientShares.ts`
- **Purpose:** Fetch active clients (delegates) with workout status.
- **Logic:** `useQuery` fetching `account_shares` + `profiles` + active `workouts`.
- **Usage:** `ClientsList.tsx`.

## Plan Steps

1.  **Create `useFormatUserDisplay`**: Extract formatting logic.
2.  **Create `usePendingInvitations`**: Move query from `SharingRequests.tsx`.
3.  **Create `useOutgoingInvitations`**: Move query and mapping from `SharingRequests.tsx`.
4.  **Update `SharingRequests.tsx`**: Implement new hooks.
5.  **Create `useTrainerShares`**: Move query from `TrainersList.tsx`.
6.  **Update `TrainersList.tsx`**: Implement new hook.
7.  **Create `useClientShares`**: Move query from `ClientsList.tsx`.
8.  **Update `ClientsList.tsx`**: Implement new hook.

