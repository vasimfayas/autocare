import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-14">{children}</main>
      <Footer />
    </div>
  );
}
