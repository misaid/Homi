import { useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { DEMO } from "./demo";

const demoAuth = {
  isLoaded: true,
  isSignedIn: true,
  userId: "user_demo",
  orgId: "org_demo",
  getToken: async () => "demo",
  signOut: async () => {},
};

/** Drop-in for Clerk's useAuth that reports a signed-in user in demo mode. */
export const useAuth: typeof useClerkAuth = DEMO
  ? ((() => demoAuth) as any)
  : useClerkAuth;
