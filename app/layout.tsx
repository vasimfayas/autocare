
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
     <body className="min-h-screen flex flex-col bg-zinc-50 bg-black dark:bg-gray-900 text-zinc-900 dark:text-white">
  
  <main className="flex-grow ">
    {children}
  </main>
 
</body>

    </html>
  );
}