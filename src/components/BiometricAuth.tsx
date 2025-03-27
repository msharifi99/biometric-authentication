"use client";

import React, { useState } from "react";

type BiometricAuthProps = {
  email: string;
  onRegisterSuccess?: (credential: Record<string, unknown>) => void;
  onLoginSuccess?: (userId: number, name: string) => void;
  registrationMode?: boolean;
};

export function BiometricAuth({
  email,
  onRegisterSuccess,
  onLoginSuccess,
  registrationMode = false,
}: BiometricAuthProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to convert base64 to ArrayBuffer (for challenge)
  const base64ToArrayBuffer = (base64: string) => {
    // Convert base64url to base64
    const base64Str = base64.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64Str.length % 4)) % 4);
    const base64WithPadding = base64Str + padding;

    // Decode base64 string
    const binary = atob(base64WithPadding);

    // Create ArrayBuffer
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const handleRegister = async () => {
    if (!email) {
      setError("Please enter your email first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      // Get registration options from server
      const response = await fetch("/api/biometrics/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Registration failed");
      }

      // Extract options from response
      const options = responseData.options;

      console.log("Registration options from server:", options);
      console.log("Challenge received from server:", options.challenge);

      // Prepare options for navigator.credentials.create()
      const publicKeyOptions = {
        ...options,
        challenge: base64ToArrayBuffer(options.challenge),
        user: {
          ...options.user,
          id: base64ToArrayBuffer(options.user.id),
        },
        excludeCredentials:
          options.excludeCredentials?.map((credential: { id: string }) => ({
            ...credential,
            id: base64ToArrayBuffer(credential.id),
          })) || [],
      };

      console.log(
        "Prepared publicKeyOptions:",
        JSON.stringify(
          publicKeyOptions,
          (key, value) => {
            if (value instanceof ArrayBuffer) {
              return `ArrayBuffer(${value.byteLength})`;
            }
            return value;
          },
          2
        )
      );

      // Create credentials with the authenticator
      const credential = (await navigator.credentials.create({
        publicKey: publicKeyOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to create credential");
      }

      // Format the credential for the server
      const credentialResponse =
        credential.response as AuthenticatorAttestationResponse;

      // Log clientDataJSON for debugging
      const clientDataJSON = Buffer.from(
        credential.response.clientDataJSON as ArrayBuffer
      ).toString("base64");

      console.log("Registration clientDataJSON (base64):", clientDataJSON);

      // Decode the clientDataJSON to verify the challenge
      const clientDataDecoded = JSON.parse(
        Buffer.from(
          credential.response.clientDataJSON as ArrayBuffer
        ).toString()
      );

      console.log("Registration clientData decoded:", clientDataDecoded);
      console.log(
        "Registration challenge in clientData:",
        clientDataDecoded.challenge
      );

      const formattedCredential = {
        id: credential.id,
        rawId: Buffer.from(credential.rawId as ArrayBuffer).toString("base64"),
        response: {
          clientDataJSON: Buffer.from(
            credentialResponse.clientDataJSON
          ).toString("base64"),
          attestationObject: Buffer.from(
            credentialResponse.attestationObject
          ).toString("base64"),
        },
        type: credential.type,
      };

      // Send the credential to the server
      const storeResponse = await fetch("/api/biometrics/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: formattedCredential,
          userId: responseData.userId,
          email: email,
        }),
      });

      const storeData = await storeResponse.json();

      if (!storeResponse.ok) {
        throw new Error(storeData.error || "Failed to store credential");
      }

      if (onRegisterSuccess) {
        onRegisterSuccess(formattedCredential);
      }
    } catch (err: unknown) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!email) {
      setError("Please enter your email first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      // Get authentication options from server
      const response = await fetch("/api/biometrics/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Authentication failed");
      }

      // Extract options from response
      const options = responseData.options;

      console.log("Authentication options from server:", options);
      console.log("Challenge received from server:", options.challenge);

      // Prepare options for navigator.credentials.get()
      const publicKeyOptions = {
        ...options,
        challenge: base64ToArrayBuffer(options.challenge),
        allowCredentials:
          options.allowCredentials?.map((credential: { id: string }) => ({
            ...credential,
            id: base64ToArrayBuffer(credential.id),
          })) || [],
      };

      console.log(
        "Authentication publicKeyOptions:",
        JSON.stringify(
          publicKeyOptions,
          (key, value) => {
            if (value instanceof ArrayBuffer) {
              return `ArrayBuffer(${value.byteLength})`;
            }
            return value;
          },
          2
        )
      );

      // Get credential from authenticator
      const credential = (await navigator.credentials.get({
        publicKey: publicKeyOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to get credential");
      }

      // Format the credential for the server
      const credentialResponse =
        credential.response as AuthenticatorAssertionResponse;

      // Log clientDataJSON for debugging
      const clientDataJSON = Buffer.from(
        credential.response.clientDataJSON as ArrayBuffer
      ).toString("base64");

      console.log("Authentication clientDataJSON (base64):", clientDataJSON);

      // Decode the clientDataJSON to verify the challenge
      const clientDataDecoded = JSON.parse(
        Buffer.from(
          credential.response.clientDataJSON as ArrayBuffer
        ).toString()
      );

      console.log("Authentication clientData decoded:", clientDataDecoded);
      console.log(
        "Authentication challenge in clientData:",
        clientDataDecoded.challenge
      );

      const formattedCredential = {
        id: credential.id,
        rawId: Buffer.from(credential.rawId as ArrayBuffer).toString("base64"),
        response: {
          clientDataJSON: Buffer.from(
            credentialResponse.clientDataJSON
          ).toString("base64"),
          authenticatorData: Buffer.from(
            credentialResponse.authenticatorData
          ).toString("base64"),
          signature: Buffer.from(credentialResponse.signature).toString(
            "base64"
          ),
          userHandle: credentialResponse.userHandle
            ? Buffer.from(credentialResponse.userHandle).toString("base64")
            : null,
        },
        type: credential.type,
      };

      // Send the credential to the server
      const verifyResponse = await fetch("/api/biometrics/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: formattedCredential,
          email: email,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "Verification failed");
      }

      console.log(verifyData);
      if (onLoginSuccess && verifyData.success) {
        onLoginSuccess(verifyData.userId, verifyData.name);
      }
    } catch (err: unknown) {
      console.error("Authentication error:", err);
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}

      {registrationMode ? (
        <button
          type="button"
          disabled={loading}
          onClick={handleRegister}
          className="w-full p-2 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {loading ? "Registering..." : "Register Biometric Authentication"}
        </button>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={handleAuthenticate}
          className="w-full p-2 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {loading ? "Authenticating..." : "Use Biometric Authentication"}
        </button>
      )}
    </div>
  );
}
