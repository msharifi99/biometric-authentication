import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { storeCredential } from "@/lib/biometrics";

// Database user type with ID
type DbUser = {
  id: number;
  name: string;
  email: string;
  password: string;
};

// Store biometric credential
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential, userId, email } = body;

    if (!credential || !userId || !email) {
      return NextResponse.json(
        { error: "Credential, user ID, and email are required" },
        { status: 400 }
      );
    }

    // Get the stored challenge from cookies
    const storedChallenge = request.cookies.get("webauthn-challenge")?.value;
    const storedUserId = request.cookies.get("webauthn-user-id")?.value;

    if (!storedChallenge) {
      return NextResponse.json(
        { error: "Registration challenge expired or missing" },
        { status: 400 }
      );
    }

    // Validate that the user exists
    const db = getDb();
    const user = db
      .prepare("SELECT * FROM users WHERE id = ? AND email = ?")
      .get(userId, email) as DbUser | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify that the user ID in the cookie matches the found user
    if (storedUserId && String(user.id) !== storedUserId) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    // Verify the challenge in the credential
    try {
      // Decode the clientDataJSON to verify the challenge
      const clientDataJSON = Buffer.from(
        credential.response.clientDataJSON,
        "base64"
      ).toString();

      const clientData = JSON.parse(clientDataJSON);

      // Log for debugging
      console.log("Registration client data challenge:", clientData.challenge);
      console.log("Stored challenge:", storedChallenge);

      // Direct comparison - challenges should match
      if (clientData.challenge !== storedChallenge) {
        // Try with more permissive comparison
        const clientChallenge = clientData.challenge
          .replace(/=/g, "")
          .replace(/\+/g, "-")
          .replace(/\//g, "_");

        const storedChallengeNormalized = storedChallenge
          .replace(/=/g, "")
          .replace(/\+/g, "-")
          .replace(/\//g, "_");

        if (clientChallenge !== storedChallengeNormalized) {
          console.log("Challenge verification failed in store");
          console.log("Normalized client challenge:", clientChallenge);
          console.log(
            "Normalized stored challenge:",
            storedChallengeNormalized
          );

          return NextResponse.json(
            { error: "Challenge verification failed during registration" },
            { status: 400 }
          );
        }
      }

      // Verify the operation is webauthn.create (for registration)
      if (clientData.type !== "webauthn.create") {
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

    // Store the credential in the database
    const credentialData = JSON.stringify(credential);

    const success = storeCredential({
      id: credential.id,
      userId: Number(userId),
      credentialData,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Failed to store credential" },
        { status: 500 }
      );
    }

    // Clear the challenge cookies
    const response = NextResponse.json({
      success: true,
      message: "Credential stored successfully",
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
    console.error("Error storing biometric credential:", error);
    return NextResponse.json(
      { error: "Failed to store biometric credential" },
      { status: 500 }
    );
  }
}
