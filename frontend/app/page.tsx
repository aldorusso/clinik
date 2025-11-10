import { LoginForm } from "@/components/login-form"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">
          Eurosynapse
        </h1>
        <p className="text-muted-foreground">
          Welcome to Eurosynapse Platform
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
