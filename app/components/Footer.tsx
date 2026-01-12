export default function Footer() {
    return (
      <footer className="w-full bg-white dark:bg-gray-800 border-t border-zinc-200 dark:border-zinc-700 py-6 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center text-zinc-600 dark:text-zinc-400">
          &copy; {new Date().getFullYear()} Autocare. All rights reserved.
        </div>
      </footer>
    );
  }