/**
 * Hook to format user profile for display
 * Returns a function that formats a user profile object into a display string
 */
export function useFormatUserDisplay() {
  return (profile: any): string => {
    if (!profile) return "Unknown User";
    
    const firstName = profile.first_name?.trim() || "";
    const lastName = profile.last_name?.trim() || "";
    const email = profile.email || "";
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) {
      return firstName;
    }
    
    if (lastName) {
      return lastName;
    }
    
    return email;
  };
}

