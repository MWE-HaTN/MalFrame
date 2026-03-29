import { createContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { UserProfileSchema, safeJsonParse } from "@/lib/validationSchemas";
import { debugWarn } from "@/lib/debugLogger";

interface UserProfile {
  name: string;
  githubUrl: string;
}

interface UserContextType {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}

const defaultProfile: UserProfile = {
  name: "MWE HaTN",
  githubUrl: "https://github.com/MWE-HaTN",
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (saved) {
      try {
        const parsed = safeJsonParse<unknown>(saved);
        const result = UserProfileSchema.safeParse(parsed);
        if (result.success) {
          return result.data;
        }
        debugWarn("User profile validation failed, using default");
      } catch {
        debugWarn("Invalid user profile JSON, using default");
        localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      }
    }
    return defaultProfile;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  }, [profile]);

  const setProfile = useCallback((newProfile: UserProfile) => {
    setProfileState(newProfile);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ profile, setProfile }), [profile, setProfile]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

