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

// Generate registration options for WebAuthn
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find the user by email
    const db = getDb();
    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as DbUser | undefined;

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please register first." },
        { status: 404 }
      );
    }

    // Check if the user already has credentials registered
    const existingCredentials = getCredentialsForUser(user.id);

    // Generate a random challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Get the hostname from the request
    const hostname = request.headers.get("host")?.split(":")[0] || "localhost";

    // Create a user id that authenticators will remember
    const userId = String(user.id).padStart(64, "0");

    // Create PublicKeyCredentialCreationOptions
    const publicKeyCredentialCreationOptions = {
      challenge: Buffer.from(challenge).toString("base64url"),
      rp: {
        name: "Biometric Auth App",
        id: hostname,
      },
      user: {
        id: userId,
        name: email,
        displayName: user.name || email,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Use platform authenticator (TouchID, FaceID, Windows Hello)
        userVerification: "required", // Require biometric verification
        requireResidentKey: false, // Don't require resident keys (simplifies UX)
      },
      timeout: 60000,
      attestation: "none", // Don't request attestation to simplify verification
      excludeCredentials: existingCredentials
        .map((cred) => {
          try {
            const credData = JSON.parse(cred.credentialData);
            return {
              id: credData.rawId || credData.id,
              type: "public-key",
            };
          } catch (error) {
            console.error("Error parsing credential for exclusion:", error);
            return null;
          }
        })
        .filter(Boolean),
    };

    // Store the challenge in session or database for later verification
    const response = NextResponse.json({
      options: publicKeyCredentialCreationOptions,
      userId: user.id, // Send the actual user ID from database
    });

    response.cookies.set(
      "webauthn-challenge",
      Buffer.from(challenge).toString("base64url"),
      {
        httpOnly: true,
        maxAge: 60 * 5, // 5 minutes
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
      }
    );

    // Store user ID in cookie for later verification
    response.cookies.set("webauthn-user-id", String(user.id), {
      httpOnly: true,
      maxAge: 60 * 5, // 5 minutes
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("Biometric registration error:", error);
    return NextResponse.json(
      { error: "Failed to generate registration options" },
      { status: 500 }
    );
  }
}
