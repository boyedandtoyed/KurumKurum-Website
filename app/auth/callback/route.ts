import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the redirect from Supabase for both email-confirmation links and
// OAuth (Google) sign-in. Exchanges the one-time `code` for a session cookie,
// then forwards the user to wherever they were headed.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Something went wrong (expired/invalid link). Send back to login with a flag.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
