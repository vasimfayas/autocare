"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { auth, db } from "@/app/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function friendlyAuthError(code?: string) {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "Login failed. Please try again.";
  }
}

async function ensureUserDoc(uid: string, payload: { name?: string | null; email?: string | null }) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(
    ref,
    {
      name: payload.name ?? "",
      email: payload.email ?? "",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/* ===========================
   LOGIN PAGE  /login
=========================== */
export function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.length >= 6 && !submitting;
  }, [email, password, submitting]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await ensureUserDoc(cred.user.uid, {
        name: cred.user.displayName,
        email: cred.user.email,
      });
      router.push("/"); // landing page
    } catch (err: any) {
      setError(friendlyAuthError(err?.code));
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    try {
      setSubmitting(true);
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);

      await ensureUserDoc(cred.user.uid, {
        name: cred.user.displayName,
        email: cred.user.email,
      });

      router.push("/");
    } catch (err: any) {
      // Common popup issues
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was closed. Please try again.");
      } else if (err?.code === "auth/operation-not-allowed") {
        setError("Google sign-in is not enabled in Firebase Auth.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-gray-950">
      {/* Top gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700" />
        <div className="relative mx-auto max-w-md px-4 pt-10 pb-20 text-white">
          <p className="text-sm/5 opacity-90">Welcome to</p>
          <h1 className="text-3xl font-semibold tracking-tight">CarCare</h1>
          <p className="mt-2 text-sm/6 opacity-90">
            Track your vehicles, services, documents, and expenses in one place.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-zinc-50 dark:bg-gray-950 rounded-t-[32px]" />
      </div>

      <div className="mx-auto max-w-md px-4 pb-10">
        <div className="rounded-3xl bg-white dark:bg-gray-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Log in</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Use your email and password.
            </p>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={onGoogle}
            disabled={submitting}
            className={cn(
              "w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm font-semibold",
              "hover:bg-zinc-50 dark:hover:bg-zinc-800 transition",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-xs text-zinc-500">OR</span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Email login */}
          <form onSubmit={onLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-white dark:bg-gray-950 text-sm outline-none
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                placeholder="you@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                Password
              </label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 pr-14 bg-white dark:bg-gray-950 text-sm outline-none
                             focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-600 dark:text-zinc-300
                             hover:text-zinc-900 dark:hover:text-white"
                >
                  {showPw ? "HIDE" : "SHOW"}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-blue-600 dark:text-blue-300 hover:underline"
                >
                  Forgot password?
                </Link>
                <span className="text-xs text-zinc-500">Min 6 characters</span>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "w-full rounded-2xl text-white px-4 py-3 text-sm font-semibold transition",
                "bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-5 text-sm text-zinc-600 dark:text-zinc-300">
            Don’t have an account?{" "}
            <Link href="/signup" className="font-semibold text-blue-600 dark:text-blue-300 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   SIGNUP PAGE  /signup
=========================== */

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

function friendlySignupError(code?: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already in use. Try logging in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    default:
      return "Signup failed. Please try again.";
  }
}

export function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      isValidEmail(email) &&
      password.length >= 6 &&
      !submitting
    );
  }, [name, email, password, submitting]);

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // Set Firebase Auth display name
      await updateProfile(cred.user, { displayName: name.trim() });

      // Create a user doc in Firestore
      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          name: name.trim(),
          email: email.trim(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.push("/"); // landing page
    } catch (err: any) {
      setError(friendlySignupError(err?.code));
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    try {
      setSubmitting(true);
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);

      await ensureUserDoc(cred.user.uid, {
        name: cred.user.displayName,
        email: cred.user.email,
      });

      router.push("/");
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was closed. Please try again.");
      } else if (err?.code === "auth/operation-not-allowed") {
        setError("Google sign-in is not enabled in Firebase Auth.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-gray-950">
      {/* Top gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700" />
        <div className="relative mx-auto max-w-md px-4 pt-10 pb-20 text-white">
          <p className="text-sm/5 opacity-90">Create your</p>
          <h1 className="text-3xl font-semibold tracking-tight">CarCare Account</h1>
          <p className="mt-2 text-sm/6 opacity-90">
            Save vehicles, service logs, statements, and documents securely.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-zinc-50 dark:bg-gray-950 rounded-t-[32px]" />
      </div>

      <div className="mx-auto max-w-md px-4 -mt-10 pb-10">
        <div className="rounded-3xl bg-white dark:bg-gray-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Sign up</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Create an account in seconds.
            </p>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={onGoogle}
            disabled={submitting}
            className={cn(
              "w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm font-semibold",
              "hover:bg-zinc-50 dark:hover:bg-zinc-800 transition",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-xs text-zinc-500">OR</span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <form onSubmit={onSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                Full name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-white dark:bg-gray-950 text-sm outline-none
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-white dark:bg-gray-950 text-sm outline-none
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                placeholder="you@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
                Password
              </label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 pr-14 bg-white dark:bg-gray-950 text-sm outline-none
                             focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/20"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-600 dark:text-zinc-300
                             hover:text-zinc-900 dark:hover:text-white"
                >
                  {showPw ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "w-full rounded-2xl text-white px-4 py-3 text-sm font-semibold transition",
                "bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {submitting ? "Creating..." : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-sm text-zinc-600 dark:text-zinc-300">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-600 dark:text-blue-300 hover:underline">
              Log in
            </Link>
          </p>

          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
