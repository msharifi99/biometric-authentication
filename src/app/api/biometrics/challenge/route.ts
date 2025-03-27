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

// Generate authentication challenge for WebAuthn
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's registered credentials
    const userCredentials = getCredentialsForUser(user.id);

    if (userCredentials.length === 0) {
      return NextResponse.json(
        { error: "No biometric credentials found for this user" },
        { status: 400 }
      );
    }

    // Generate a random challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Get the hostname from the request
    const hostname = request.headers.get("host")?.split(":")[0] || "localhost";

    // Format credentials for the client
    const formattedCredentials = userCredentials
      .map((cred) => {
        try {
          const credData = JSON.parse(cred.credentialData);
          return {
            id: credData.id,
            type: credData.type || "public-key",
            transports: credData.transports || ["internal"],
          };
        } catch (error) {
          console.error("Error parsing credential data:", error);
          return null;
        }
      })
      .filter(Boolean);

    // Create PublicKeyCredentialRequestOptions
    const publicKeyCredentialRequestOptions = {
      challenge: Buffer.from(challenge).toString("base64url"),
      rpId: hostname,
      userVerification: "required",
      timeout: 60000,
      allowCredentials: formattedCredentials,
    };

    // Store the challenge in a cookie for later verification
    const response = NextResponse.json({
      options: publicKeyCredentialRequestOptions,
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
    console.error("Biometric challenge generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication challenge" },
      { status: 500 }
    );
  }
}
