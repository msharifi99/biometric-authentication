import { getDb } from "./db";

export type BiometricCredential = {
  id: string;
  userId: number;
  credentialData: string;
};

type DbCredential = {
  id: string;
  user_id: number;
  credential_data: string;
};

// Store a biometric credential
export function storeCredential(credential: BiometricCredential): boolean {
  try {
    const db = getDb();

    db.prepare(
      "INSERT INTO biometric_credentials (id, user_id, credential_data) VALUES (?, ?, ?)"
    ).run(credential.id, credential.userId, credential.credentialData);

    return true;
  } catch (error) {
    console.error("Error storing biometric credential:", error);
    return false;
  }
}

// Get all biometric credentials for a user
export function getCredentialsForUser(userId: number): BiometricCredential[] {
  try {
    const db = getDb();

    const credentials = db
      .prepare("SELECT * FROM biometric_credentials WHERE user_id = ?")
      .all(userId) as DbCredential[];

    return credentials.map((cred) => ({
      id: cred.id,
      userId: cred.user_id,
      credentialData: cred.credential_data,
    }));
  } catch (error) {
    console.error("Error getting biometric credentials:", error);
    return [];
  }
}

// Get a specific credential by ID
export function getCredentialById(
  credentialId: string
): BiometricCredential | null {
  try {
    const db = getDb();

    const credential = db
      .prepare("SELECT * FROM biometric_credentials WHERE id = ?")
      .get(credentialId) as DbCredential | undefined;

    if (!credential) {
      return null;
    }

    return {
      id: credential.id,
      userId: credential.user_id,
      credentialData: credential.credential_data,
    };
  } catch (error) {
    console.error("Error getting biometric credential by ID:", error);
    return null;
  }
}

// Delete a credential
export function deleteCredential(credentialId: string): boolean {
  try {
    const db = getDb();

    db.prepare("DELETE FROM biometric_credentials WHERE id = ?").run(
      credentialId
    );

    return true;
  } catch (error) {
    console.error("Error deleting biometric credential:", error);
    return false;
  }
}
