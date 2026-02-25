export interface McpServerStatus {
  name: "supabase" | "vercel";
  installed: boolean;
  location: "project" | "user" | null;
}

export interface SetupResult {
  supabase: McpServerStatus;
  vercel: McpServerStatus;
  installed: string[];
  skipped: string[];
}
