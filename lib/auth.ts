import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { headers } from "next/headers";
import { supabase } from "@/utils/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveTenantIdFromHost } from "@/lib/tenant-resolver";
import { UserRole } from "@/types";

/** Auth callback'larda tenant_id: önce x-tenant-id, yoksa host'tan çözümle */
async function getTenantIdForAuth(): Promise<string | null> {
  try {
    const h = await headers();
    const fromHeader = h.get("x-tenant-id");
    if (fromHeader) return fromHeader;
    const host = h.get("host") ?? h.get("x-forwarded-host") ?? "";
    return host ? resolveTenantIdFromHost(host) : null;
  } catch (err) {
    console.error("[auth] getTenantIdForAuth headers() hatası:", err);
    return null;
  }
}

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
      // For credentials login: authorize zaten users kontrolü yaptı.
      // user_tenants kaydı yoksa ekle (admin panelinde görünsün, OAuth ile aynı davranış)
      if (account?.type === "credentials") {
        const tenantId = await getTenantIdForAuth();
        if (tenantId && user?.id) {
          const { data: utRow } = await supabaseAdmin
            .from("user_tenants")
            .select("approved_at")
            .eq("user_id", user.id)
            .eq("tenant_id", tenantId)
            .single();

          if (!utRow) {
            const isSuperAdmin = user.role === "super_admin";
            const { error: utError } = await supabaseAdmin.from("user_tenants").upsert(
              {
                user_id: user.id,
                tenant_id: tenantId,
                approved_at: isSuperAdmin ? new Date().toISOString() : null,
              },
              { onConflict: "user_id,tenant_id" }
            );
            if (utError && process.env.NODE_ENV === "development") {
              console.error("[auth] user_tenants insert hatası (credentials):", utError);
            }
          }
        }
        return true;
      }

      // For OAuth (Google) login
      if (account?.type === "oauth") {
        try {
          if (!user?.email) return false;

          let { data: existingUser } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("email", user.email)
            .single();

          if (!existingUser) {
            const { data: newUser, error: insertErr } = await supabaseAdmin
              .from("users")
              .insert({
                email: user.email,
                name: user.name ?? null,
                image: user.image ?? null,
                status: "pending",
              })
              .select("*")
              .single();

            if (insertErr) {
              console.error("[auth] users INSERT hatası:", insertErr);
              // Yarış koşulu: bir önceki istek zaten oluşturmuş olabilir
              const { data: fallbackUser } = await supabaseAdmin
                .from("users")
                .select("*")
                .eq("email", user.email)
                .single();
              if (!fallbackUser) {
                console.error("[auth] users fallback SELECT de bulamadı, giriş reddediliyor");
                return false;
              }
              existingUser = fallbackUser;
            } else {
              existingUser = newUser;
            }
          }

          if (!existingUser) return false;

          user.id = existingUser.id;
          user.role = existingUser.role as UserRole;
          user.status = existingUser.status;

          if (existingUser.status === "blacklisted") return false;

          const tenantId = await getTenantIdForAuth();
          if (tenantId) {
            // Mevcut satırı upsert ile güncelleme: approved_at her girişte null yazılır ve
            // admin onayı silinirdi. Credentials ile aynı — yalnızca kayıt yoksa INSERT.
            const { data: utRow } = await supabaseAdmin
              .from("user_tenants")
              .select("user_id")
              .eq("user_id", existingUser.id)
              .eq("tenant_id", tenantId)
              .maybeSingle();

            if (!utRow) {
              const isSuperAdmin = existingUser.role === "super_admin";
              const { error: utError } = await supabaseAdmin.from("user_tenants").insert({
                user_id: existingUser.id,
                tenant_id: tenantId,
                approved_at: isSuperAdmin ? new Date().toISOString() : null,
              });
              if (utError) {
                // Yarış: paralel istek aynı satırı eklemiş olabilir
                if (utError.code !== "23505") {
                  console.error("[auth] user_tenants insert hatası (OAuth):", utError);
                }
              }
            }
          }

          return true;
        } catch (err) {
          console.error("[auth] signIn OAuth beklenmeyen hata:", err);
          return false;
        }
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