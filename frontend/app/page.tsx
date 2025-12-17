import { LoginForm } from "@/components/login-form"

export default function Home() {
  return (
    <main className="flex min-h-screen">
      {/* Left side - Brand and Marketing */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border border-white/30 rounded-lg rotate-12"></div>
          <div className="absolute top-40 right-40 w-24 h-24 border border-white/30 rounded-lg -rotate-12"></div>
          <div className="absolute bottom-40 left-40 w-28 h-28 border border-white/30 rounded-lg rotate-45"></div>
        </div>
        
        <div className="flex flex-col justify-between h-full p-12 relative z-10 text-white">
          {/* Top section with logo */}
          <div>
            <div className="mb-8">
              <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Center section with main content */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Main heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold mb-2">
                Hola<br />
                Clinic.online! 👋
              </h1>
            </div>
            
            {/* Description */}
            <div className="max-w-md">
              <p className="text-lg text-white/90 leading-relaxed">
                Simplifica y automatiza la gestión de leads médicos. 
                Obtén mayor productividad a través de la automatización 
                y ahorra toneladas de tiempo.
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div>
            <p className="text-white/60 text-sm">
              © 2024 Clinic.online. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        {/* Mobile header for small screens */}
        <div className="lg:hidden absolute top-8 left-8 right-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Clinic.online</h1>
          <p className="text-gray-600 text-sm">Gestión integral de clínicas estéticas</p>
        </div>
        
        <div className="w-full max-w-md mt-24 lg:mt-0">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
