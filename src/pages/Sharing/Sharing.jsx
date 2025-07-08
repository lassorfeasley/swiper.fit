import { useState } from "react";
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export default function Sharing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form
  const [email, setEmail] = useState("");

  // -------------------------------
  // Queries
  // -------------------------------
  const ownerSharesQuery = useQuery({
    queryKey: ["shares_owned", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_shares")
        .select("id, delegate_email, delegate_user_id, revoked_at, created_at")
        .eq("owner_user_id", user.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const delegateSharesQuery = useQuery({
    queryKey: ["shares_delegate", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Step 1: fetch shares where I'm the delegate
      const { data: shares, error } = await supabase
        .from("account_shares")
        .select("id, owner_user_id, created_at")
        .eq("delegate_user_id", user.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;

      if (!shares || shares.length === 0) return [];

      const ownerIds = shares.map((s) => s.owner_user_id);

      // Step 2: fetch owner names from profiles
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", ownerIds);

      const ownerInfoMap = {};
      ownerIds.forEach((id) => {
        const p = profileRows?.find((pr) => pr.id === id) || {};
        ownerInfoMap[id] = {
          first_name: p.first_name || null,
          last_name: p.last_name || null,
          email: p.email || null,
        };
      });

      return shares.map((s) => ({
        ...s,
        ownerInfo: ownerInfoMap[s.owner_user_id],
      }));
    },
  });

  // -------------------------------
  // Mutations
  // -------------------------------
  const addShareMutation = useMutation({
    mutationFn: async (emailToAdd) => {
      // Try to insert share
      const { error } = await supabase.from("account_shares").insert({
        owner_user_id: user.id,
        delegate_email: emailToAdd.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares_owned", user?.id] });
      setEmail("");
    },
  });

  const revokeShareMutation = useMutation({
    mutationFn: async (shareId) => {
      const { error } = await supabase
        .from("account_shares")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", shareId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares_owned", user?.id] });
    },
  });

  // -------------------------------
  // Helpers
  // -------------------------------
  const handleAddShare = () => {
    if (!email.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address");
      return;
    }
    addShareMutation.mutate(email);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-10">
      <header>
        <h1 className="text-2xl font-bold">Account Sharing</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Grant other Swiper.fit users permission to manage your account, or
          view the accounts that you can manage.
        </p>
      </header>
      {user && (
        <p className="text-sm text-neutral-700 font-mono">Logged in as: {user.email}</p>
      )}

      {/* Grant access form */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Grant access</h2>
        <div className="flex gap-2 items-end max-w-md">
          <div className="flex-1 space-y-1">
            <label htmlFor="share-email" className="text-sm font-medium">
              User email
            </label>
            <Input
              id="share-email"
              type="email"
              placeholder="someone@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={addShareMutation.isPending}
            />
          </div>
          <Button
            type="button"
            className="h-[52px]"
            onClick={handleAddShare}
            disabled={addShareMutation.isPending}
          >
            {addShareMutation.isPending ? "Sharing…" : "Share"}
          </Button>
        </div>
        {addShareMutation.isError && (
          <p className="text-sm text-destructive">
            {(addShareMutation.error)?.message || "Something went wrong."}
          </p>
        )}
      </section>

      {/* List of people current user has shared with */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">People who can manage your account</h2>

        {ownerSharesQuery.isLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : ownerSharesQuery.data?.length === 0 ? (
          <p className="text-sm text-neutral-500">No one has access yet.</p>
        ) : (
          <ul className="space-y-2">
            {ownerSharesQuery.data.map((share) => (
              <li
                key={share.id}
                className="bg-neutral-100 border border-neutral-200 px-3 py-2 rounded text-sm flex justify-between items-center"
              >
                <span>{share.delegate_email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeShareMutation.mutate(share.id)}
                  disabled={revokeShareMutation.isPending}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* List of accounts current user can manage */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Accounts you can manage</h2>
        {delegateSharesQuery.isLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : delegateSharesQuery.data?.length === 0 ? (
          <p className="text-sm text-neutral-500">You haven't been granted access to any accounts.</p>
        ) : (
          <ul className="space-y-2">
            {delegateSharesQuery.data.map((share) => {
              const { ownerInfo } = share;
              const name = ownerInfo?.first_name || ownerInfo?.last_name ? `${ownerInfo?.first_name || ""} ${ownerInfo?.last_name || ""}`.trim() : null;
              const emailDisplay = ownerInfo?.email;
              return (
                <li
                  key={share.id}
                  className="bg-neutral-100 border border-neutral-200 px-3 py-2 rounded text-sm"
                >
                  {name && emailDisplay ? `${name} (${emailDisplay})` : emailDisplay || name || share.owner_user_id}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
} 