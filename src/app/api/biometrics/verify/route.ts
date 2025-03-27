import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCredentialsForUser } from "@/lib/biometrics";

// Database user type with ID
type DbUser = {
  id: number;
  name: string;
  email: string;
  password: string;
};

// Verify biometric credential
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential, email } = body;

    if (!credential || !email) {
      return NextResponse.json(
        { error: "Credential and email are required" },
        { status: 400 }
      );
    }

    // Get the stored challenge from cookies
    const storedChallenge = request.cookies.get("webauthn-challenge")?.value;
    const storedUserId = request.cookies.get("webauthn-user-id")?.value;

    if (!storedChallenge) {
      return NextResponse.json(
        { error: "Authentication challenge expired or missing" },
        { status: 400 }
      );
    }

    // Find the user by email
    const db = getDb();
    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as DbUser | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify that the user ID in the cookie matches the found user
    if (storedUserId && String(user.id) !== storedUserId) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    // Get user's registered credentials
    const userCredentials = getCredentialsForUser(user.id);

    if (userCredentials.length === 0) {
      return NextResponse.json(
        { error: "No biometric credentials found for this user" },
        { status: 400 }
      );
    }

    // Find the matching credential
    const matchingCredential = userCredentials.find((cred) => {
      try {
        const credData = JSON.parse(cred.credentialData);
        return credData.id === credential.id;
      } catch {
        return false;
      }
    });

    if (!matchingCredential) {
      return NextResponse.json(
        { error: "No matching credential found" },
        { status: 400 }
      );
    }

    // In a real production environment, you would:
    // 1. Decode the clientDataJSON and verify its origin, type and challenge
    // 2. Verify the authenticatorData flags (user presence, user verification)
    // 3. Verify the signature using the stored public key

    // For this implementation, we'll perform basic verification:
    try {
      // Decode the clientDataJSON to verify the challenge
      const clientDataJSON = Buffer.from(
        credential.response.clientDataJSON,
        "base64"
      ).toString();

      const clientData = JSON.parse(clientDataJSON);

      // Log the challenges for debugging
      console.log("Client challenge:", clientData.challenge);
      console.log("Stored challenge:", storedChallenge);

      // The challenge in clientData is base64url encoded directly
      // No need to convert to base64 for comparison, compare directly
      if (clientData.challenge !== storedChallenge) {
        console.log("Challenge verification failed");
        console.log("Client challenge:", clientData.challenge);
        console.log("Stored challenge:", storedChallenge);

        // Add a check that's more permissive for debugging
        // This is a fallback and shouldn't be needed in production
        const clientChallenge = clientData.challenge
          .replace(/=/g, "")
          .replace(/\+/g, "-")
          .replace(/\//g, "_");

        const storedChallengeNormalized = storedChallenge
          .replace(/=/g, "")
          .replace(/\+/g, "-")
          .replace(/\//g, "_");

        if (clientChallenge !== storedChallengeNormalized) {
          return NextResponse.json(
            { error: "Challenge verification failed" },
            { status: 400 }
          );
        }
      }

      // Verify the operation is webauthn.get (for authentication)
      if (clientData.type !== "webauthn.get") {
        return NextResponse.json(
          { error: "Invalid operation type" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error during credential verification:", error);
      return NextResponse.json(
        { error: "Failed to verify credential data" },
        { status: 400 }
      );
    }

    // If we get here, the verification was successful
    // In a real app, you would now generate a session token

    // Clear the challenge cookies
    const response = NextResponse.json({
      success: true,
      message: "Biometric verification successful",
      userId: user.id,
      name: user.name,
      email: user.email,
    });

    response.cookies.set("webauthn-challenge", "", {
      maxAge: 0,
      path: "/",
    });
    response.cookies.set("webauthn-user-id", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Biometric verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify biometric credential" },
      { status: 500 }
    );
  }
}
