import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <div>
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}
