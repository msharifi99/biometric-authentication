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

// Check if user has biometric credentials
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

    // Return whether the user has biometric credentials
    return NextResponse.json({
      hasBiometrics: userCredentials.length > 0,
      userId: user.id,
    });
  } catch (error) {
    console.error("Error checking biometric credentials:", error);
    return NextResponse.json(
      { error: "Failed to check biometric credentials" },
      { status: 500 }
    );
  }
}
