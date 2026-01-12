import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-50 dark:bg-gray-900 text-zinc-900 dark:text-white">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}