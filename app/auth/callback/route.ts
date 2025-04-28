import { NextResponse } from 'next/server'
import { createServerActionClient } from '@/lib/supabase/server' // Updated import

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    // Handle OAuth provider errors
    if (error) {
      console.error(`OAuth error: ${error}`, errorDescription);
      return NextResponse.redirect(
        `${origin}/auth/error?message=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code) {
      console.error("No code provided in callback");
      // return the user to an error page with instructions
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent('No authentication code provided')}`)
    }

    // Exchange the code for a session
    const supabase = createServerActionClient() // Updated function call
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError)
      // Redirect to the home page with an error message
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(exchangeError.message)}`)
    }

    // Success - redirect to the requested page
    return NextResponse.redirect(`${origin}${next}`)
  } catch (error) {
    console.error("Unexpected error in auth callback:", error);
    return NextResponse.redirect(
      `${new URL(request.url).origin}/auth/error?message=${encodeURIComponent('An unexpected error occurred during authentication')}`
    );
  }
}

/* Original code structure kept for reference, but replaced by the above logic
export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
*/
