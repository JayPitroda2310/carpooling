import { supabase } from "../lib/supabase";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ProfileUpdate {
  full_name?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

/** Upsert so it works whether or not a profile row already exists. */
export async function updateProfile(userId: string, fields: ProfileUpdate): Promise<Profile> {
  if (!supabase) throw new Error("Supabase isn't connected.");
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...fields })
    .select()
    .single();
  if (error) throw error;

  // Keep the denormalized driver info on this user's rides in sync,
  // so name/photo changes show everywhere they appear as the driver.
  const ridePatch: Record<string, string> = {};
  if (fields.full_name !== undefined) ridePatch.driver_name = fields.full_name;
  if (fields.avatar_url !== undefined) ridePatch.driver_avatar = fields.avatar_url;
  if (Object.keys(ridePatch).length > 0) {
    await supabase.from("rides").update(ridePatch).eq("user_id", userId);
  }

  return data as Profile;
}

/** Uploads a new avatar to Storage, saves the URL on the profile, returns the URL. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!supabase) throw new Error("Supabase isn't connected.");
  const path = `${userId}/avatar`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // cache-bust so the new image shows immediately
  const url = `${data.publicUrl}?t=${Date.now()}`;
  await updateProfile(userId, { avatar_url: url });
  return url;
}
