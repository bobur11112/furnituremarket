export type UserRole = "buyer" | "seller" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
};

export type AuthUser = {
  id: string;
  email: string;
};
