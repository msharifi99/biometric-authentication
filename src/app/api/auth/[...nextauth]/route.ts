import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateUser, authenticateUserById } from "@/lib/auth";

// Define session and JWT types to ensure proper typing
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userId: { label: "User ID", type: "text" },
        biometric: { label: "Biometric", type: "boolean" },
      },
      async authorize(credentials) {
        console.log(
          "NextAuth authorize function called with credentials:",
          JSON.stringify({
            email: credentials?.email,
            password: credentials?.password ? "[REDACTED]" : undefined,
            userId: credentials?.userId,
            biometric: credentials?.biometric,
          })
        );

        // Handle biometric authentication
        const isBiometric = credentials?.biometric === "true";
        if (isBiometric && credentials?.userId) {
          try {
            console.log(
              "Attempting biometric authentication with userId:",
              credentials.userId
            );
            const userId = parseInt(credentials.userId.toString(), 10);
            const user = await authenticateUserById(userId);

            if (user) {
              console.log(
                "Biometric authentication successful for user:",
                user.email
              );
              return {
                id: user.id,
                name: user.name,
                email: user.email,
              };
            }
            console.log(
              "Biometric authentication failed: User not found with ID",
              userId
            );
            return null;
          } catch (error) {
            console.error("Biometric authentication error:", error);
            return null;
          }
        }

        // Handle regular password authentication
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password for regular authentication");
          return null;
        }

        try {
          console.log(
            "Attempting password authentication for email:",
            credentials.email
          );
          const user = await authenticateUser({
            email: credentials.email,
            password: credentials.password,
          });

          if (user) {
            console.log(
              "Password authentication successful for user:",
              user.email
            );
            return {
              id: user.id,
              name: user.name,
              email: user.email,
            };
          }
          console.log(
            "Password authentication failed: Invalid credentials for email",
            credentials.email
          );
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log(
        "NextAuth JWT callback called with token:",
        JSON.stringify(token)
      );
      console.log(
        "User in JWT callback:",
        user ? JSON.stringify(user) : "null"
      );

      if (user) {
        console.log("Setting user data in JWT token:", user.id);
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      console.log(
        "NextAuth session callback called with session:",
        JSON.stringify(session)
      );
      console.log("Token in session callback:", JSON.stringify(token));

      if (token && session.user) {
        console.log("Setting user ID in session:", token.id);
        session.user.id = token.id;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
