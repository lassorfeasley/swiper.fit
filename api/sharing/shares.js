import { supabase } from '@/supabaseClient';

/**
 * Creates a legacy share (immediate sharing without invitation)
 * This maintains backward compatibility with the existing sharing system
 * @param {object} shareData - Share data including owner_user_id, delegate_user_id, etc.
 * @returns {Promise<object>} Created share data
 */
export async function createLegacyShare(shareData) {
  try {
    const legacyShareData = {
      ...shareData,
      status: 'active',
      request_type: 'legacy'
    };

    const { data, error } = await supabase
      .from("account_shares")
      .insert(legacyShareData)
      .select()
      .single();

    if (error) {
      console.error("Failed to create legacy share:", error);
      throw new Error("Failed to create share");
    }

    console.log("Legacy share created successfully:", data);
    return data;

  } catch (error) {
    console.error("Error creating legacy share:", error);
    throw error;
  }
}

/**
 * Updates share permissions
 * @param {string} shareId - ID of the share to update
 * @param {object} permissions - New permissions
 * @returns {Promise<object>} Updated share data
 */
export async function updateSharePermissions(shareId, permissions) {
  try {
    const { data, error } = await supabase
      .from("account_shares")
      .update(permissions)
      .eq("id", shareId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update share permissions:", error);
      throw new Error("Failed to update permissions");
    }

    console.log("Share permissions updated successfully:", data);
    return data;

  } catch (error) {
    console.error("Error updating share permissions:", error);
    throw error;
  }
}

/**
 * Revokes a share (soft delete)
 * @param {string} shareId - ID of the share to revoke
 * @returns {Promise<void>}
 */
export async function revokeShare(shareId) {
  try {
    const { error } = await supabase
      .from("account_shares")
      .update({ 
        status: 'revoked',
        revoked_at: new Date().toISOString()
      })
      .eq("id", shareId);

    if (error) {
      console.error("Failed to revoke share:", error);
      throw new Error("Failed to revoke share");
    }

    console.log("Share revoked successfully");

  } catch (error) {
    console.error("Error revoking share:", error);
    throw error;
  }
}

/**
 * Gets shares owned by a user (where user is the owner)
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} Array of owned shares
 */
export async function getOwnedShares(userId) {
  try {
    const { data: shares, error } = await supabase
      .from("account_shares")
      .select(`
        id,
        owner_user_id,
        delegate_user_id,
        delegate_email,
        created_at,
        status,
        request_type,
        can_create_routines,
        can_start_workouts,
        can_review_history,
        profiles!account_shares_delegate_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("owner_user_id", userId)
      .eq("status", "active") // Only get active shares
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch owned shares:", error);
      throw new Error("Failed to fetch owned shares");
    }

    console.log("Owned shares fetched successfully:", shares);
    return shares;

  } catch (error) {
    console.error("Error fetching owned shares:", error);
    throw error;
  }
}

/**
 * Gets shares where user is the delegate (shared with user)
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} Array of shares where user is delegate
 */
export async function getDelegateShares(userId) {
  try {
    const { data: shares, error } = await supabase
      .from("account_shares")
      .select(`
        id,
        owner_user_id,
        created_at,
        status,
        request_type,
        can_create_routines,
        can_start_workouts,
        can_review_history,
        profiles!account_shares_owner_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("delegate_user_id", userId)
      .eq("status", "active") // Only get active shares
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch delegate shares:", error);
      throw new Error("Failed to fetch delegate shares");
    }

    // Fetch active workouts for all owners
    let activeByOwner = {};
    if (shares && shares.length > 0) {
      const ownerIds = shares.map(share => share.owner_user_id);
      const { data: activeWorkouts, error: activeErr } = await supabase
        .from('workouts')
        .select(`id, user_id, routine_id, is_active, completed_at, routines!fk_workouts__routines(routine_name)`) 
        .in('user_id', ownerIds)
        .eq('is_active', true);
      
      if (!activeErr && Array.isArray(activeWorkouts)) {
        activeByOwner = activeWorkouts.reduce((acc, w) => {
          acc[w.user_id] = w;
          return acc;
        }, {});
      }
    }

    // Add active workout data to shares
    const sharesWithActiveWorkouts = shares.map(share => ({
      ...share,
      activeWorkout: activeByOwner[share.owner_user_id] || null
    }));

    console.log("Delegate shares fetched successfully:", sharesWithActiveWorkouts);
    return sharesWithActiveWorkouts;

  } catch (error) {
    console.error("Error fetching delegate shares:", error);
    throw error;
  }
}

/**
 * Checks if a user can manage another user's account
 * @param {string} managerId - ID of the potential manager
 * @param {string} clientId - ID of the client
 * @returns {Promise<boolean>} Whether the manager can manage the client
 */
export async function canManageAccount(managerId, clientId) {
  try {
    const { data, error } = await supabase
      .from("account_shares")
      .select("id")
      .eq("owner_user_id", clientId)
      .eq("delegate_user_id", managerId)
      .eq("status", "active")
      .limit(1);

    if (error) {
      console.error("Failed to check management permissions:", error);
      return false;
    }

    return data && data.length > 0;

  } catch (error) {
    console.error("Error checking management permissions:", error);
    return false;
  }
}

/**
 * Gets all sharing relationships for a user (both owned and delegated)
 * @param {string} userId - ID of the user
 * @returns {Promise<object>} Object with ownedShares and delegateShares
 */
export async function getAllSharingRelationships(userId) {
  try {
    const [ownedShares, delegateShares, pendingRequests] = await Promise.all([
      getOwnedShares(userId),
      getDelegateShares(userId),
      getPendingRequests(userId)
    ]);

    return {
      ownedShares,
      delegateShares,
      pendingRequests
    };

  } catch (error) {
    console.error("Error fetching all sharing relationships:", error);
    throw error;
  }
}
