import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyMfaRequirement, verifyMfaToken } from "@/lib/auth/mfa";
import { logAuditEvent } from "@/lib/auth/audit";

// Credential Health Check
const GOOGLE_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_ID || !GOOGLE_SECRET) {
  console.warn("⚠️ Google OAuth credentials are missing. Social login will be disabled.");
}

// Extends NextAuth types with our Role and MFA states
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      mfaVerified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    mfaVerified: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "doctor@aetherdx.ai" },
        password: { label: "Password", type: "password" },
        mfaToken: { label: "MFA Token", type: "text", required: false }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password.");
        }

        const ip = req?.headers?.["x-forwarded-for"] || "127.0.0.1";
        const email = credentials.email.toLowerCase();

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          throw new Error("Invalid credentials."); // Avoid leaking user existence
        }

        // Brute-force lockout prevention check
        if (user.lockedUntil && new Date() < user.lockedUntil) {
          await logAuditEvent({ action: "ACCOUNT_LOCKED", userId: user.id, ipAddress: ip });
          throw new Error("Account is temporarily locked due to too many failed attempts.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          const newFailedAttempts = user.failedLoginAttempts + 1;
          const updates: any = { failedLoginAttempts: newFailedAttempts };
          
          if (newFailedAttempts >= 5) {
            updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock 15 mins
            updates.failedLoginAttempts = 0; // Reset counter post-lockout
          }

          await prisma.user.update({ where: { id: user.id }, data: updates });
          await logAuditEvent({ action: "LOGIN_FAILED", userId: user.id, ipAddress: ip, metadata: { count: newFailedAttempts }});
          
          throw new Error("Invalid credentials.");
        }

        // Reset failed login attempts on successful password hit
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null }
          });
        }

        // MFA Evaluation Pipeline
        const mfaRequired = await verifyMfaRequirement({
          id: user.id,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
        });

        // If MFA is required but no token was provided in this payload:
        if (mfaRequired && !credentials.mfaToken) {
          throw new Error("MFA_REQUIRED"); 
        }

        if (mfaRequired && credentials.mfaToken) {
          const isValid = await verifyMfaToken(user.id, credentials.mfaToken);
          if (!isValid) {
            throw new Error("Invalid MFA token.");
          }
        }

        // Complete the Auth Cycle
        await logAuditEvent({ action: "LOGIN_SUCCESS", userId: user.id, ipAddress: ip });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          mfaVerified: mfaRequired ? true : false,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        
        // Auto-provision social users in our database
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email,
              passwordHash: "SOCIAL_AUTH_ONLY", // Placeholder for social users
              role: "PATIENT", // Default role for new social users
            }
          });
          await logAuditEvent({ action: "LOGIN_SUCCESS", metadata: { provider: "google", isNew: true } });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // Fetch full user data from DB if it was a social login or missing role
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! }
        });
        
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.mfaVerified = dbUser.mfaEnabled || false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.mfaVerified = token.mfaVerified;
      }
      return session;
    }
  },
  events: {
    async signIn(message) {
      if (message.user) {
        // Track the created Session Device Context directly
        await prisma.session.create({
          data: {
            userId: (message.user as any).id,
            token: `session_${Date.now()}_${Math.random().toString(36).substring(2,9)}`, // Generic tracking ID
            deviceType: "Aether Web Platform", // Realistically parsed from User-Agent headers
            isRevoked: false,
          }
        });
      }
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_dev_only"
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
