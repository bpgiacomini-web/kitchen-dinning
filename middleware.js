export default function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname === '/') {
    url.pathname = '/index-persistence.html';
    return Response.redirect(url, 307);
  }
  return;
}
export const config = { matcher: ['/'] };