import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div>
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
