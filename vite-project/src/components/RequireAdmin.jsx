import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

export default function RequireAdmin({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-zinc-600">Loading...</p>
      </main>
    );
  }

  if (!isSignedIn) {
    // go sign in, then return here
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  const role = user?.publicMetadata?.role;
  const isAdmin = role === "admin";

  if (!isAdmin) {
    // not admin → send to home (or you can make a "Not Authorized" page)
    return <Navigate to="/" replace />;
  }

  return children;
}
