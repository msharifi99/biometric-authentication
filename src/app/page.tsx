"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BiometricAuth } from "@/components/BiometricAuth";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated" && session?.user?.email) {
      // Check if user has biometrics set up
      fetch("/api/biometrics/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: session.user.email }),
      })
        .then((res) => res.json())
        .then((data) => {
          setHasBiometrics(data.hasBiometrics);
          setUserId(data.userId);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error checking biometrics:", err);
          setLoading(false);
        });
    }
  }, [status, router, session]);

  const handleBiometricRegisterSuccess = (
    credential: Record<string, unknown>
  ) => {
    console.log("Biometric registration successful:", credential.id);
    setShowBiometricSetup(false);
    setHasBiometrics(true);
    setError("Biometric registration successful!");

    // Clear success message after 3 seconds
    setTimeout(() => {
      setError(null);
    }, 3000);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">It worked</h1>
        <p className="text-gray-700 mb-6">
          You are logged in as{" "}
          <span className="font-medium">{session.user?.name}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {error}
          </div>
        )}

        {!hasBiometrics && !showBiometricSetup && (
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              You don&apos;t have biometric authentication set up yet.
            </p>
            <button
              onClick={() => setShowBiometricSetup(true)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mb-4"
            >
              Set up biometric login
            </button>
          </div>
        )}

        {showBiometricSetup && (
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Set up biometric authentication for quicker logins
            </p>
            {session.user?.email && userId && (
              <BiometricAuth
                email={session.user.email}
                registrationMode={true}
                onRegisterSuccess={handleBiometricRegisterSuccess}
              />
            )}
            <button
              onClick={() => setShowBiometricSetup(false)}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800"
            >
              Cancel
            </button>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
