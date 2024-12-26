import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header>Admin Header</header>
        <main>{children}</main>
        <footer>Admin Footer</footer>
      </body>
    </html>
  );
}
