import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = { title: "AIO Docs", description: "Document preparation with AI" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8 max-w-6xl">{children}</main>
        </div>
      </body>
    </html>
  );
}
