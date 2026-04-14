// Minimal duck-typed interface for the Supabase client methods we use.
// The real SupabaseClient satisfies this; the fake in tests also satisfies it.
// Using this instead of the full SupabaseClient type avoids forcing tests to
// construct a complete client object.

// deno-lint-ignore no-explicit-any
export type DbClient = {
  from(table: string): any;
};
