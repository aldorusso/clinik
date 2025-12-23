import { LoginForm } from "@/components/login-form"
import { Logo } from "@/components/logo"

export default function Home() {
  return (
    <main className="flex min-h-screen">
      {/* Left side - Brand (Dark) */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-24 left-24 w-32 h-32 border border-white/5 rounded-2xl rotate-12"></div>
          <div className="absolute top-1/3 right-24 w-24 h-24 border border-white/5 rounded-2xl -rotate-12"></div>
          <div className="absolute bottom-1/3 left-1/4 w-40 h-40 border border-mint/10 rounded-3xl rotate-45"></div>
          <div className="absolute bottom-24 right-24 w-20 h-20 border border-mint/5 rounded-2xl -rotate-6"></div>
        </div>

        <div className="flex flex-col justify-between h-full px-16 py-14 relative z-10">
          {/* Top section with logo */}
          <div>
            <Logo size="lg" variant="light" />
          </div>

          {/* Center section with main content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-cream mb-6">
              Gestiona tu clínica
              <br />
              <span className="text-mint">de forma inteligente.</span>
            </h1>

            <p className="text-lg text-cream-dark/60 leading-relaxed">
              Simplifica la gestión de pacientes, citas y leads en un solo lugar.
            </p>
          </div>

          {/* Footer */}
          <div>
            <p className="text-cream-dark/30 text-sm">
              © 2024 ClinicManager. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form (Cream/Beige) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        {/* Mobile header for small screens */}
        <div className="lg:hidden absolute top-8 left-0 right-0 text-center">
          <Logo size="md" variant="default" />
          <p className="text-muted-foreground text-sm mt-2">Gestión integral de clínicas</p>
        </div>

        <div className="w-full max-w-md mt-24 lg:mt-0">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
