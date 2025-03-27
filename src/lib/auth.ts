import { compare, hash } from "bcrypt";
import { getDb } from "./db";

export type User = {
  id: string;
  name: string;
  email: string;
};

export type UserCredentials = {
  name?: string;
  email: string;
  password: string;
};

// Database user type with password
type DbUser = {
  id: number;
  name: string;
  email: string;
  password: string;
};

// Basic user record from DB
type DbRecord = {
  id: number;
  name: string;
  email: string;
};

// Register a new user
export async function registerUser(
  credentials: UserCredentials
): Promise<User | null> {
  try {
    const { name, email, password } = credentials;

    if (!name || !email || !password) {
      throw new Error("Missing required fields");
    }

    const db = getDb();

    // Check if user already exists
    const existingUser = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Insert the new user
    const result = db
      .prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
      .run(name, email, hashedPassword);

    // Get the newly created user
    const user = db
      .prepare("SELECT id, name, email FROM users WHERE id = ?")
      .get(result.lastInsertRowid) as DbRecord;

    return user
      ? {
          id: String(user.id),
          name: user.name,
          email: user.email,
        }
      : null;
  } catch (error) {
    console.error("Error registering user:", error);
    return null;
  }
}

// Authenticate a user
export async function authenticateUser(credentials: {
  email: string;
  password: string;
}): Promise<User | null> {
  try {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new Error("Missing email or password");
    }

    const db = getDb();

    // Get user by email
    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as DbUser | undefined;

    if (!user) {
      return null;
    }

    // Verify password
    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) {
      return null;
    }

    return {
      id: String(user.id),
      name: user.name,
      email: user.email,
    };
  } catch (error) {
    console.error("Error authenticating user:", error);
    return null;
  }
}

// Get user by ID
export function getUserById(id: string): User | null {
  try {
    const db = getDb();
    const user = db
      .prepare("SELECT id, name, email FROM users WHERE id = ?")
      .get(id) as DbRecord | undefined;
    return user
      ? {
          id: String(user.id),
          name: user.name,
          email: user.email,
        }
      : null;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}

// Authenticate a user by ID (for biometric auth)
export async function authenticateUserById(
  userId: number
): Promise<User | null> {
  try {
    if (!userId) {
      throw new Error("Missing user ID");
    }

    const db = getDb();

    // Get user by ID
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as
      | DbUser
      | undefined;

    if (!user) {
      return null;
    }

    return {
      id: String(user.id),
      name: user.name,
      email: user.email,
    };
  } catch (error) {
    console.error("Error authenticating user by ID:", error);
    return null;
  }
}
