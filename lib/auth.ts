import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { headers } from "next/headers";
import { supabase } from "@/utils/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UserRole } from "@/types";

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
          role: user.role as UserRole,
          status: user.status,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // İstek host'una göre baseUrl kullan (golbasi.localhost, kahramankazan.localhost vb.)
      try {
        const h = await headers();
        const host = h.get("host") ?? h.get("x-forwarded-host");
        const proto = (h.get("x-forwarded-proto") || "http").replace(/,$/, "");
        const requestOrigin = host ? `${proto}://${host}` : baseUrl;
        const effectiveBaseUrl = requestOrigin.replace(/\/$/, "");
        if (url.startsWith("/")) return `${effectiveBaseUrl}${url}`;
        try {
          if (new URL(url).origin === effectiveBaseUrl) return url;
        } catch {
          // url geçersiz olabilir
        }
        return effectiveBaseUrl;
      } catch {
        return url.startsWith("/") ? `${baseUrl}${url}` : baseUrl;
      }
    },
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
          const { data: newUser, error } = await supabaseAdmin
            .from("users")
            .insert([
              {
                email: user.email,
                name: user.name,
                image: user.image,
                status: "pending",
                role: null as UserRole,
              },
            ])
            .select("id")
            .single();
          if (error || !newUser) return false;
          const tenantId = (await headers()).get("x-tenant-id");
          if (tenantId) {
            await supabaseAdmin.from("user_tenants").insert({
              user_id: newUser.id,
              tenant_id: tenantId,
              approved_at: null,
            });
          }
          return "/";
        }

        // Update user data
        if (existingUser) {
          user.id = existingUser.id;
          user.role = existingUser.role as UserRole;
          user.status = existingUser.status;
        }

        // If user exists but is blacklisted
        if (existingUser.status === "blacklisted") return false;

        // user_tenants: Per-tenant erişim ve onay
        const tenantId = (await headers()).get("x-tenant-id");
        if (tenantId) {
          const { data: utRow } = await supabaseAdmin
            .from("user_tenants")
            .select("tenant_id, approved_at")
            .eq("user_id", existingUser.id)
            .eq("tenant_id", tenantId)
            .single();

          if (utRow) {
            // Kayıt var: approved_at null ise bu tenant için onay bekliyor
            if (utRow.approved_at == null) {
              return "/giris?error=TenantPendingApproval";
            }
            return true;
          }

          // Kayıt yok: user_tenants'a ekle (admin panelinde görünsün)
          const { data: otherTenants } = await supabaseAdmin
            .from("user_tenants")
            .select("tenant_id, approved_at")
            .eq("user_id", existingUser.id);
          const hasApprovedElsewhere =
            (otherTenants ?? []).some((ut) => ut.approved_at != null);

          await supabaseAdmin.from("user_tenants").upsert(
            {
              user_id: existingUser.id,
              tenant_id: tenantId,
              approved_at: null,
            },
            { onConflict: "user_id,tenant_id" }
          );

          if (
            existingUser.status === "approved" &&
            hasApprovedElsewhere
          ) {
            return "/giris?error=TenantAccessDenied";
          }
          return "/";
        }

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
        token.role = user.role as UserRole;
        token.status = user.status;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as string;
        session.user.image = token.image as string;
      }
      // Tenant bilgisi middleware'den gelen header'dan eklenir
      try {
        const h = await headers();
        session.tenant_id = h.get("x-tenant-id") ?? undefined;
        // tenant_slug için DB'den çekilebilir; şimdilik boş bırakıyoruz
      } catch {
        // headers() bazı ortamlarda (middleware dışı) hata verebilir
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