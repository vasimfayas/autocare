import AuthGate from "@/app/components/AuthGate";
import HomeLandingPage from "@/app/(app)/HomeLandingPage";

export default function Page() {
  return (
    <AuthGate>
      <HomeLandingPage />
    </AuthGate>
  );
}
