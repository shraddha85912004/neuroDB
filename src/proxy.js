import { withAuth } from "next-auth/middleware";

export default withAuth(function middleware(req) {
  // custom logic can go here if needed
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
