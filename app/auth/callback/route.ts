import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  // On récupère la destination "next" ou on va au dashboard par défaut
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    // On échange le code temporaire contre une session active
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirection dynamique vers la page demandée
  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}