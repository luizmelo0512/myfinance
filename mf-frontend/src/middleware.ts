import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Cookie do Quarkus JWT (mf_session_token)
  const token = request.cookies.get('mf_session_token')?.value;

  const { pathname } = request.nextUrl;

  const isPublicRoute =
    pathname.startsWith('/login') || pathname.startsWith('/sing-up');

  console.log('Middleware executado para:', pathname);
  console.log('Token encontrado:', !!token);

  // Se não tem token e não é rota pública, redirecionar para login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('message', 'session_expired');
    return NextResponse.redirect(loginUrl);
  }

  // Se tem token e está em rota pública, redirecionar para dashboard
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// 4. Configurar quais rotas o middleware deve ignorar (arquivos estáticos, imagens, etc)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-|icons|screenshots).*)',
  ],
};
