#!/usr/bin/env python3
"""
Script para ejecutar todas las pruebas automatizadas del sistema.
Proporciona diferentes opciones de ejecución y reportes.
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path


def run_command(command, description):
    """Ejecutar un comando y mostrar el resultado."""
    print(f"\n{'='*60}")
    print(f"🔄 {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=True, 
            capture_output=True, 
            text=True
        )
        print(result.stdout)
        if result.stderr:
            print(f"Warnings: {result.stderr}")
        print(f"✅ {description} - COMPLETADO")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - FALLÓ")
        print(f"Error: {e}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Ejecutar tests automatizados")
    parser.add_argument(
        "--type", 
        choices=["all", "unit", "integration", "auth", "permissions", "api"], 
        default="all",
        help="Tipo de tests a ejecutar"
    )
    parser.add_argument(
        "--coverage", 
        action="store_true",
        help="Generar reporte de cobertura"
    )
    parser.add_argument(
        "--verbose", 
        action="store_true",
        help="Ejecutar en modo verbose"
    )
    parser.add_argument(
        "--parallel", 
        action="store_true",
        help="Ejecutar tests en paralelo"
    )
    parser.add_argument(
        "--file", 
        help="Ejecutar un archivo de test específico"
    )
    
    args = parser.parse_args()
    
    # Verificar que estamos en el directorio correcto
    if not Path("requirements.txt").exists():
        print("❌ Error: Ejecutar desde el directorio backend/")
        sys.exit(1)
    
    # Instalar dependencias si es necesario
    print("🔧 Verificando dependencias de testing...")
    install_cmd = "pip install -r requirements.txt"
    if not run_command(install_cmd, "Instalando dependencias"):
        print("❌ No se pudieron instalar las dependencias")
        sys.exit(1)
    
    # Configurar comando base de pytest
    base_cmd = ["pytest"]
    
    if args.verbose:
        base_cmd.extend(["-v", "-s"])
    
    if args.coverage:
        base_cmd.extend(["--cov=app", "--cov-report=term-missing", "--cov-report=html"])
    
    if args.parallel:
        base_cmd.extend(["-n", "auto"])
    
    # Construir comando según el tipo de test
    if args.file:
        cmd = base_cmd + [f"tests/{args.file}"]
        description = f"Ejecutando archivo: {args.file}"
    elif args.type == "all":
        cmd = base_cmd + ["tests/"]
        description = "Ejecutando TODOS los tests"
    elif args.type == "unit":
        cmd = base_cmd + ["-m", "unit", "tests/"]
        description = "Ejecutando tests UNITARIOS"
    elif args.type == "integration":
        cmd = base_cmd + ["-m", "integration", "tests/"]
        description = "Ejecutando tests de INTEGRACIÓN"
    elif args.type == "auth":
        cmd = base_cmd + ["-m", "auth", "tests/"]
        description = "Ejecutando tests de AUTENTICACIÓN"
    elif args.type == "permissions":
        cmd = base_cmd + ["-m", "permissions", "tests/"]
        description = "Ejecutando tests de PERMISOS"
    elif args.type == "api":
        cmd = base_cmd + ["-m", "api", "tests/"]
        description = "Ejecutando tests de API"
    
    # Ejecutar tests
    success = run_command(" ".join(cmd), description)
    
    # Mostrar resumen
    print(f"\n{'='*60}")
    print("📊 RESUMEN DE TESTS")
    print(f"{'='*60}")
    
    if success:
        print("✅ Todos los tests pasaron exitosamente")
        
        if args.coverage:
            print("\n📈 Reporte de cobertura generado en htmlcov/index.html")
            print("Para ver el reporte: python -m http.server 8000 -d htmlcov")
        
        print("\n🎉 ¡Sistema funcionando correctamente!")
    else:
        print("❌ Algunos tests fallaron")
        print("💡 Revisa los errores arriba para identificar problemas")
        sys.exit(1)


if __name__ == "__main__":
    main()