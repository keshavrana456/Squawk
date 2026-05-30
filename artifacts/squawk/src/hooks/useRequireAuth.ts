import { useUser } from "@clerk/react";
import { useLocation } from "wouter";

export function useRequireAuth() {
  const { isSignedIn } = useUser();
  const [, setLocation] = useLocation();

  return (cb?: () => void) => {
    if (!isSignedIn) {
      setLocation("/sign-in");
      return false;
    }
    cb?.();
    return true;
  };
}
