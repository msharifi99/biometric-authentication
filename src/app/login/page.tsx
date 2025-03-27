"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BiometricAuth } from "@/components/BiometricAuth";
import { signIn } from "next-auth/react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showBiometric, setShowBiometric] = useState(false);

  const handleToggleBiometric = () => {
    if (!email) {
      setError("Please enter your email first");
      return;
    }
    setShowBiometric(!showBiometric);
  };

  const handleBiometricSuccess = (userId: number, name: string) => {
    console.log(
      "Biometric auth successful, setting up session for userId:",
      userId
    );

    signIn("credentials", {
      userId: userId.toString(),
      email,
      name,
      biometric: true,
      redirect: false,
    })
      .then((result) => {
        console.log("Biometric login result:", result);

        if (result?.error) {
          setError(result.error);
          return;
        }

        router.push("/");
      })
      .catch((err) => {
        console.error("Biometric login error:", err);
        setError("Error logging in: " + err.message);
      });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      console.log("Submitting login form with email:", email);

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("Login result:", result);

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push("/");
    } catch (err: unknown) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="mt-2 text-gray-600">Welcome back!</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {!showBiometric && (
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {showBiometric ? (
            <>
              <BiometricAuth
                email={email}
                onLoginSuccess={handleBiometricSuccess}
              />
              <button
                type="button"
                onClick={handleToggleBiometric}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Use password instead
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={handleToggleBiometric}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Use biometric login
              </button>
            </>
          )}
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Don&apos;t have an account?
              </span>
            </div>
          </div>

          <div className="mt-6">
            <a
              href="/register"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Create an account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
