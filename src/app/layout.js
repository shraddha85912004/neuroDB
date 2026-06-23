import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "AI Data Explorer SaaS",
  description: "Query any database using plain English. Supports MongoDB, MySQL, PostgreSQL, CSV, and Excel.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
