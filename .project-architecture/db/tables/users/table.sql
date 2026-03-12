CREATE TABLE "public"."users" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "email" varchar NOT NULL,
  "name" varchar,
  "image" varchar,
  "role" "public"."user_role",
  "status" "public"."user_status" DEFAULT 'pending'::user_status,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
;

ALTER TABLE "public"."users" 
  OWNER TO "postgres";
