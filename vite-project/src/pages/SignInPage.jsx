import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="max-w-md">
        <h1 className="text-3xl font-black tracking-tight">Sign in</h1>
        <p className="mt-2 text-zinc-600">
          Please sign in to donate and access your account.
        </p>

        <div className="mt-6">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/animals?tab=donate"
          />
        </div>
      </div>
    </main>
  );
}
