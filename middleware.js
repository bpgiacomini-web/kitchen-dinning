export default function middleware(request) {
  const url = new URL(request.url);
  if (['/', '/index.html', '/index-persistence.html'].includes(url.pathname)) {
    url.pathname = '/architecture-v2/';
    return Response.redirect(url, 307);
  }
  return;
}
export const config = { matcher: ['/', '/index.html', '/index-persistence.html'] };
