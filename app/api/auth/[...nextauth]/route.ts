import NextAuth from "next-auth";
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/utils/supabaseClient";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account"
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Check if it's the default admin account
        if (
          credentials.email === "admin@ankarakurban.com.tr" &&
          credentials.password === "1q2w3e"
        ) {
          return {
            id: "admin",
            email: credentials.email,
            name: "Admin",
            role: "admin",
            status: "approved",
          };
        }

        // Check user in database
        const { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (error || !user) return null;

        // Check if user is blacklisted
        if (user.status === "blacklisted") return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For credentials login, we've already checked everything in authorize
      if (account?.type === "credentials") return true;

      // For OAuth (Google) login
      if (account?.type === "oauth") {
        const { data: existingUser } = await supabase
          .from("users")
          .select("*")
          .eq("email", user.email)
          .single();

        // If user doesn't exist, create them with pending status
        if (!existingUser) {
          const { error } = await supabase.from("users").insert([
            {
              email: user.email,
              name: user.name,
              image: user.image,
              status: "pending",
              role: null,
            },
          ]);
          if (error) return false;
          return "/";
        }

        // Update user data
        if (existingUser) {
          user.id = existingUser.id;
          user.role = existingUser.role;
          user.status = existingUser.status;
        }

        // If user exists but is blacklisted
        if (existingUser.status === "blacklisted") return false;

        // If user exists but is pending
        if (existingUser.status === "pending") return "/";

        return true;
      }

      return false;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
        session.user.image = token.image as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/giris",
    error: "/giris",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 