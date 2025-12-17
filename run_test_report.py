#!/usr/bin/env python3
"""
Script para generar un reporte completo de todos los tests del sistema.
Este script ejecuta todos los tests y genera un resumen detallado.
"""

import subprocess
import json
import datetime
from pathlib import Path

def run_pytest_json(test_path="tests/"):
    """Ejecuta pytest con output JSON."""
    try:
        result = subprocess.run([
            "docker-compose", "exec", "-T", "backend", 
            "pytest", test_path, 
            "--json-report", "--json-report-file=/tmp/test_report.json",
            "-v", "--tb=short"
        ], 
        capture_output=True, 
        text=True, 
        cwd=Path(__file__).parent
        )
        
        # Obtener el archivo JSON del contenedor
        json_result = subprocess.run([
            "docker-compose", "exec", "-T", "backend", 
            "cat", "/tmp/test_report.json"
        ], 
        capture_output=True, 
        text=True, 
        cwd=Path(__file__).parent
        )
        
        if json_result.returncode == 0:
            return json.loads(json_result.stdout)
        else:
            return None
    except Exception as e:
        print(f"Error ejecutando tests: {e}")
        return None

def run_individual_test_files():
    """Ejecuta cada archivo de test individualmente para obtener detalles."""
    test_files = [
        "tests/test_authentication.py",
        "tests/test_leads.py", 
        "tests/test_appointments.py",
        "tests/test_commercial_objectives.py",
        "tests/test_patients.py"
    ]
    
    results = {}
    
    for test_file in test_files:
        print(f"\n🧪 Ejecutando {test_file}...")
        try:
            result = subprocess.run([
                "docker-compose", "exec", "-T", "backend", 
                "pytest", test_file, "-v", "--tb=no", "-q"
            ], 
            capture_output=True, 
            text=True, 
            timeout=120,  # 2 minutos timeout
            cwd=Path(__file__).parent
            )
            
            results[test_file] = {
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr
            }
            
            # Contar resultados
            stdout = result.stdout
            if "passed" in stdout or "failed" in stdout or "error" in stdout:
                print(f"✅ {test_file} - Ejecutado")
            else:
                print(f"⚠️  {test_file} - Sin resultados claros")
                
        except subprocess.TimeoutExpired:
            print(f"⏰ {test_file} - Timeout")
            results[test_file] = {"returncode": -1, "error": "timeout"}
        except Exception as e:
            print(f"❌ {test_file} - Error: {e}")
            results[test_file] = {"returncode": -2, "error": str(e)}
    
    return results

def analyze_test_results(results):
    """Analiza los resultados de los tests."""
    summary = {
        "total_files": len(results),
        "successful_files": 0,
        "failed_files": 0,
        "error_files": 0,
        "details": {}
    }
    
    for test_file, result in results.items():
        file_name = test_file.split("/")[-1]
        
        if result["returncode"] == 0:
            summary["successful_files"] += 1
            status = "✅ PASSED"
        elif result["returncode"] == 1:
            summary["failed_files"] += 1
            status = "❌ FAILED"
        else:
            summary["error_files"] += 1
            status = "🚫 ERROR"
        
        # Extraer números de tests del output
        stdout = result.get("stdout", "")
        
        # Buscar patrones como "5 passed", "3 failed", etc.
        import re
        passed = re.findall(r'(\d+) passed', stdout)
        failed = re.findall(r'(\d+) failed', stdout)
        errors = re.findall(r'(\d+) error', stdout)
        
        summary["details"][file_name] = {
            "status": status,
            "passed": int(passed[0]) if passed else 0,
            "failed": int(failed[0]) if failed else 0,
            "errors": int(errors[0]) if errors else 0,
            "returncode": result["returncode"]
        }
    
    return summary

def generate_report(summary):
    """Genera un reporte legible."""
    report = f"""
🧪 REPORTE DE TESTS - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{'='*80}

📊 RESUMEN GENERAL:
- Archivos de test ejecutados: {summary['total_files']}
- Archivos exitosos: {summary['successful_files']}
- Archivos con fallos: {summary['failed_files']}
- Archivos con errores: {summary['error_files']}

📋 DETALLE POR ARCHIVO:
"""

    for file_name, details in summary["details"].items():
        report += f"""
{details['status']} {file_name}
  - Tests pasados: {details['passed']}
  - Tests fallidos: {details['failed']} 
  - Tests con error: {details['errors']}
  - Código de salida: {details['returncode']}
"""

    # Análisis de cobertura de funcionalidades
    report += f"""

🎯 ANÁLISIS DE FUNCIONALIDADES:

🔐 AUTENTICACIÓN Y ROLES:
{summary['details'].get('test_authentication.py', {}).get('status', '❓ NO EJECUTADO')}
- Login/logout, permisos por rol, aislamiento multi-tenant

👥 GESTIÓN DE LEADS:
{summary['details'].get('test_leads.py', {}).get('status', '❓ NO EJECUTADO')}
- CRUD, asignación, filtros, conversión a pacientes

📅 SISTEMA DE CITAS:
{summary['details'].get('test_appointments.py', {}).get('status', '❓ NO EJECUTADO')}
- Creación, actualización, disponibilidad, confirmaciones

🎯 OBJETIVOS COMERCIALES:
{summary['details'].get('test_commercial_objectives.py', {}).get('status', '❓ NO EJECUTADO')}
- Creación, seguimiento, estadísticas comerciales

🏥 GESTIÓN DE PACIENTES:
{summary['details'].get('test_patients.py', {}).get('status', '❓ NO EJECUTADO')}
- Vista de pacientes, información limitada por rol

{'='*80}

💡 RECOMENDACIONES:
"""

    # Recomendaciones basadas en resultados
    if summary['failed_files'] > 0:
        report += """
⚠️  Hay archivos de test con fallos. Revisar:
   1. Endpoints faltantes en la API
   2. Permisos de roles incorrectos
   3. Validaciones de datos faltantes
"""

    if summary['error_files'] > 0:
        report += """
🚫 Hay archivos con errores de configuración. Revisar:
   1. Base de datos de testing
   2. Fixtures de usuarios y tenants
   3. Imports de modelos
"""

    if summary['successful_files'] == summary['total_files']:
        report += """
🎉 ¡Todos los tests están funcionando correctamente!
   El sistema está listo para uso en producción.
"""

    return report

def main():
    """Función principal."""
    print("🚀 Iniciando análisis completo de tests...")
    print("📋 Esto puede tomar varios minutos...")
    
    # Ejecutar tests individuales
    results = run_individual_test_files()
    
    # Analizar resultados  
    summary = analyze_test_results(results)
    
    # Generar reporte
    report = generate_report(summary)
    
    # Mostrar reporte
    print(report)
    
    # Guardar reporte en archivo
    report_file = Path(__file__).parent / "test_report.txt"
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(report)
    
    print(f"\n💾 Reporte guardado en: {report_file}")
    
    # Código de salida basado en resultados
    if summary['error_files'] > 0:
        exit(2)  # Errores críticos
    elif summary['failed_files'] > 0:
        exit(1)  # Fallos en tests
    else:
        exit(0)  # Todo exitoso

if __name__ == "__main__":
    main()