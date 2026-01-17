import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="max-w-md">
        <h1 className="text-3xl font-black tracking-tight">Create account</h1>
        <p className="mt-2 text-zinc-600">
          Create an account to donate and help stray animals.
        </p>

        <div className="mt-6">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/animals?tab=donate"
          />
        </div>
      </div>
    </main>
  );
}
