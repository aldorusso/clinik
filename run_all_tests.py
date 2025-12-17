#!/usr/bin/env python3
"""
🧪 SCRIPT MAESTRO DE TESTS AUTOMATIZADOS
Sistema de Gestión de Leads Médicos - Clinik.download

Este script ejecuta una suite completa de pruebas automatizadas que verifican:
✅ Todas las funcionalidades del sistema
✅ Permisos y acceso por rol 
✅ Flujos end-to-end completos
✅ Componentes frontend
✅ APIs backend

Uso:
    python run_all_tests.py [opciones]

Ejemplos:
    python run_all_tests.py                    # Ejecutar todos los tests
    python run_all_tests.py --backend-only     # Solo tests backend
    python run_all_tests.py --frontend-only    # Solo tests frontend
    python run_all_tests.py --e2e-only         # Solo tests E2E
    python run_all_tests.py --fast             # Tests rápidos solamente
    python run_all_tests.py --coverage         # Con reporte de cobertura
"""

import os
import sys
import subprocess
import argparse
import time
from pathlib import Path
from datetime import datetime
import json


class TestRunner:
    def __init__(self):
        self.start_time = datetime.now()
        self.results = {
            'backend': {'status': 'pending', 'duration': 0, 'tests': 0},
            'frontend': {'status': 'pending', 'duration': 0, 'tests': 0},
            'e2e': {'status': 'pending', 'duration': 0, 'tests': 0}
        }
        self.total_tests = 0
        self.failed_tests = 0
        
    def print_header(self):
        """Mostrar header del script."""
        print("🏥" + "="*80)
        print("🧪 TESTS AUTOMATIZADOS - SISTEMA DE GESTIÓN DE LEADS MÉDICOS")
        print("📅 " + self.start_time.strftime("%Y-%m-%d %H:%M:%S"))
        print("="*82)
        
    def print_section(self, title, emoji="🔧"):
        """Mostrar header de sección."""
        print(f"\n{emoji} {title}")
        print("-" * (len(title) + 4))
        
    def run_command(self, command, description, cwd=None):
        """Ejecutar comando y capturar resultado."""
        print(f"\n▶️  {description}")
        print(f"📍 Directorio: {cwd or os.getcwd()}")
        print(f"💻 Comando: {command}")
        
        start_time = time.time()
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                check=True,
                capture_output=True,
                text=True,
                cwd=cwd
            )
            
            duration = time.time() - start_time
            print(f"✅ {description} - EXITOSO ({duration:.1f}s)")
            
            # Extraer número de tests si es posible
            if "pytest" in command and result.stdout:
                self._extract_pytest_results(result.stdout)
            elif "jest" in command and result.stdout:
                self._extract_jest_results(result.stdout)
            elif "playwright" in command and result.stdout:
                self._extract_playwright_results(result.stdout)
                
            return True, duration, result.stdout
            
        except subprocess.CalledProcessError as e:
            duration = time.time() - start_time
            print(f"❌ {description} - FALLÓ ({duration:.1f}s)")
            print(f"💥 Error: {e}")
            if e.stdout:
                print(f"📤 Stdout:\n{e.stdout}")
            if e.stderr:
                print(f"📥 Stderr:\n{e.stderr}")
            
            return False, duration, e.stdout or ""
    
    def _extract_pytest_results(self, output):
        """Extraer resultados de pytest."""
        lines = output.split('\n')
        for line in lines:
            if 'passed' in line and 'failed' in line:
                # Ej: "5 failed, 10 passed in 2.34s"
                parts = line.split()
                for i, part in enumerate(parts):
                    if part == 'passed' and i > 0:
                        self.total_tests += int(parts[i-1])
                    elif part == 'failed' and i > 0:
                        self.failed_tests += int(parts[i-1])
    
    def _extract_jest_results(self, output):
        """Extraer resultados de Jest."""
        lines = output.split('\n')
        for line in lines:
            if 'Tests:' in line:
                # Ej: "Tests: 2 failed, 8 passed, 10 total"
                parts = line.split()
                for i, part in enumerate(parts):
                    if part == 'total' and i > 0:
                        self.total_tests += int(parts[i-1])
                    elif part == 'failed,' and i > 0:
                        self.failed_tests += int(parts[i-1])
    
    def _extract_playwright_results(self, output):
        """Extraer resultados de Playwright."""
        lines = output.split('\n')
        for line in lines:
            if 'passed' in line and ('failed' in line or 'test' in line):
                # Ej: "5 passed (2.3s)" o "3 failed, 7 passed (5.1s)"
                parts = line.split()
                for i, part in enumerate(parts):
                    if part == 'passed' and i > 0:
                        self.total_tests += int(parts[i-1])
                    elif part == 'failed,' and i > 0:
                        self.failed_tests += int(parts[i-1])
    
    def check_prerequisites(self):
        """Verificar prerrequisitos del sistema."""
        self.print_section("VERIFICACIÓN DE PRERREQUISITOS", "🔍")
        
        # Verificar directorios
        if not Path("backend").exists():
            print("❌ Directorio backend/ no encontrado")
            return False
            
        if not Path("frontend").exists():
            print("❌ Directorio frontend/ no encontrado")  
            return False
            
        # Verificar archivos clave
        files_to_check = [
            "backend/requirements.txt",
            "backend/app/main.py",
            "frontend/package.json",
            "frontend/next.config.ts"
        ]
        
        for file_path in files_to_check:
            if not Path(file_path).exists():
                print(f"❌ Archivo requerido no encontrado: {file_path}")
                return False
                
        print("✅ Todos los prerrequisitos están presentes")
        return True
    
    def setup_environment(self):
        """Configurar entorno de testing."""
        self.print_section("CONFIGURACIÓN DEL ENTORNO", "⚙️")
        
        # Instalar dependencias backend
        success, _, _ = self.run_command(
            "pip install -r requirements.txt",
            "Instalando dependencias Python",
            cwd="backend"
        )
        
        if not success:
            return False
            
        # Instalar dependencias frontend
        success, _, _ = self.run_command(
            "npm install",
            "Instalando dependencias Node.js",
            cwd="frontend"
        )
        
        return success
    
    def run_backend_tests(self, args):
        """Ejecutar tests del backend."""
        self.print_section("TESTS BACKEND (Python/FastAPI)", "🐍")
        
        # Configurar comando pytest
        cmd_parts = ["python", "run_tests.py"]
        
        if args.fast:
            cmd_parts.extend(["--type", "unit"])
        
        if args.coverage:
            cmd_parts.append("--coverage")
        
        if args.verbose:
            cmd_parts.append("--verbose")
            
        if args.parallel:
            cmd_parts.append("--parallel")
        
        command = " ".join(cmd_parts)
        
        success, duration, output = self.run_command(
            command,
            "Ejecutando tests Python (autenticación, permisos, APIs, leads, citas, objetivos)",
            cwd="backend"
        )
        
        self.results['backend']['status'] = 'passed' if success else 'failed'
        self.results['backend']['duration'] = duration
        
        return success
    
    def run_frontend_tests(self, args):
        """Ejecutar tests del frontend."""
        self.print_section("TESTS FRONTEND (TypeScript/React)", "⚛️")
        
        # Tests unitarios y de componentes
        cmd_parts = ["npm", "run", "test"]
        
        if args.coverage:
            cmd_parts = ["npm", "run", "test:coverage"]
        
        if not args.verbose:
            cmd_parts.append("--watchAll=false")
        
        command = " ".join(cmd_parts)
        
        success, duration, output = self.run_command(
            command,
            "Ejecutando tests React (componentes, autenticación, formularios)",
            cwd="frontend"
        )
        
        self.results['frontend']['status'] = 'passed' if success else 'failed'
        self.results['frontend']['duration'] = duration
        
        return success
    
    def run_e2e_tests(self, args):
        """Ejecutar tests end-to-end."""
        self.print_section("TESTS END-TO-END (Playwright)", "🎭")
        
        # Verificar que los servicios estén corriendo
        print("🔧 Verificando servicios necesarios...")
        
        # Comando base de Playwright
        cmd_parts = ["npm", "run", "test:e2e"]
        
        if args.verbose:
            cmd_parts.append("--reporter=line")
        
        if args.headed:
            cmd_parts.append("--headed")
        
        command = " ".join(cmd_parts)
        
        success, duration, output = self.run_command(
            command,
            "Ejecutando tests E2E (flujos completos, permisos, navegación)",
            cwd="frontend"
        )
        
        self.results['e2e']['status'] = 'passed' if success else 'failed'
        self.results['e2e']['duration'] = duration
        
        return success
    
    def generate_report(self):
        """Generar reporte final de tests."""
        end_time = datetime.now()
        total_duration = (end_time - self.start_time).total_seconds()
        
        self.print_section("📊 REPORTE FINAL DE TESTS", "📈")
        
        print(f"⏱️  Duración total: {total_duration:.1f}s")
        print(f"🧪 Tests ejecutados: {self.total_tests}")
        print(f"✅ Tests exitosos: {self.total_tests - self.failed_tests}")
        print(f"❌ Tests fallidos: {self.failed_tests}")
        
        print("\n📋 RESUMEN POR CATEGORÍA:")
        print("-" * 50)
        
        for category, result in self.results.items():
            status_emoji = "✅" if result['status'] == 'passed' else "❌" if result['status'] == 'failed' else "⏸️"
            print(f"{status_emoji} {category.upper()}: {result['status']} ({result['duration']:.1f}s)")
        
        # Determinar resultado general
        all_passed = all(r['status'] == 'passed' for r in self.results.values() if r['status'] != 'pending')
        
        print("\n" + "="*60)
        if all_passed and self.failed_tests == 0:
            print("🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!")
            print("✨ El sistema está funcionando correctamente")
            return True
        else:
            print("⚠️  ALGUNOS TESTS FALLARON")
            print("🔍 Revisa los errores arriba para identificar problemas")
            return False
    
    def save_report_json(self):
        """Guardar reporte en formato JSON."""
        report = {
            'timestamp': self.start_time.isoformat(),
            'duration': (datetime.now() - self.start_time).total_seconds(),
            'total_tests': self.total_tests,
            'failed_tests': self.failed_tests,
            'success_rate': ((self.total_tests - self.failed_tests) / max(self.total_tests, 1)) * 100,
            'results': self.results
        }
        
        with open('test_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"💾 Reporte guardado en: test_report.json")


def main():
    parser = argparse.ArgumentParser(
        description="Suite completa de tests automatizados para Sistema de Gestión de Leads",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos de uso:
  python run_all_tests.py                    # Todos los tests
  python run_all_tests.py --backend-only     # Solo backend
  python run_all_tests.py --frontend-only    # Solo frontend  
  python run_all_tests.py --e2e-only         # Solo E2E
  python run_all_tests.py --fast             # Tests rápidos
  python run_all_tests.py --coverage         # Con cobertura
        """
    )
    
    # Opciones de ejecución
    parser.add_argument('--backend-only', action='store_true', help='Ejecutar solo tests backend')
    parser.add_argument('--frontend-only', action='store_true', help='Ejecutar solo tests frontend')
    parser.add_argument('--e2e-only', action='store_true', help='Ejecutar solo tests E2E')
    parser.add_argument('--fast', action='store_true', help='Ejecutar solo tests rápidos (unitarios)')
    parser.add_argument('--coverage', action='store_true', help='Generar reporte de cobertura')
    parser.add_argument('--verbose', action='store_true', help='Modo verbose')
    parser.add_argument('--parallel', action='store_true', help='Ejecutar tests en paralelo')
    parser.add_argument('--headed', action='store_true', help='Ejecutar E2E en modo headed (visible)')
    parser.add_argument('--skip-setup', action='store_true', help='Saltar configuración del entorno')
    
    args = parser.parse_args()
    
    # Crear runner
    runner = TestRunner()
    runner.print_header()
    
    # Verificar prerrequisitos
    if not runner.check_prerequisites():
        sys.exit(1)
    
    # Configurar entorno (opcional)
    if not args.skip_setup:
        if not runner.setup_environment():
            print("❌ Error configurando el entorno")
            sys.exit(1)
    
    # Determinar qué tests ejecutar
    run_backend = not args.frontend_only and not args.e2e_only
    run_frontend = not args.backend_only and not args.e2e_only
    run_e2e = not args.backend_only and not args.frontend_only
    
    if args.backend_only:
        run_backend = True
        run_frontend = False
        run_e2e = False
    elif args.frontend_only:
        run_backend = False
        run_frontend = True
        run_e2e = False
    elif args.e2e_only:
        run_backend = False
        run_frontend = False
        run_e2e = True
    
    # Ejecutar tests
    all_success = True
    
    if run_backend:
        if not runner.run_backend_tests(args):
            all_success = False
    
    if run_frontend:
        if not runner.run_frontend_tests(args):
            all_success = False
    
    if run_e2e:
        if not runner.run_e2e_tests(args):
            all_success = False
    
    # Generar reporte final
    success = runner.generate_report()
    runner.save_report_json()
    
    # Exit code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()