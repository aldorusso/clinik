import os
import time
import re
import requests
import threading
import googlemaps
import pandas as pd
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from geopy.distance import geodesic
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import subprocess
import sys

# --- CONFIGURACIÓN ---
load_dotenv()
google_api_key = os.getenv("Maps_API_KEY")
if not google_api_key:
    messagebox.showerror("Error", "No se encontró la variable Maps_API_KEY.")
    exit()

gmaps = googlemaps.Client(key=google_api_key)
KEYWORDS = ['contact', 'contacto', 'about', 'nosotros', 'quienes']

# --- CONTADORES ---
total_resultados = 0
emails_bs_count = 0
redes_bs_count = 0
redes_por_tipo = {
    'facebook': 0,
    'instagram': 0,
    'twitter': 0,
    'linkedin': 0,
    'tiktok': 0
}

# --- FUNCIONES ---
def extract_info_from_html(html):
    soup = BeautifulSoup(html, 'html.parser')
    emails = set(re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html))
    redes = []
    for a in soup.find_all('a', href=True):
        href = a['href']
        if any(social in href for social in redes_por_tipo):
            redes.append(href)
            for red in redes_por_tipo:
                if red in href:
                    redes_por_tipo[red] += 1
    return list(emails), list(set(redes))

def scrape_with_requests(url):
    global emails_bs_count, redes_bs_count
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, timeout=10, headers=headers)
        if response.status_code != 200:
            return [], []
        emails, redes = extract_info_from_html(response.text)
        if emails: emails_bs_count += 1
        if redes: redes_bs_count += 1
        return emails, redes
    except:
        return [], []

def scrape_web_info(url):
    if not url or url == 'N/A':
        return [], []
    emails, redes = scrape_with_requests(url)
    return emails, redes

# --- INTERFAZ ---

def centrar_ventana(ventana, ancho=600, alto=550):
    ventana.update_idletasks()
    pantalla_ancho = ventana.winfo_screenwidth()
    pantalla_alto = ventana.winfo_screenheight()
    x = (pantalla_ancho // 2) - (ancho // 2)
    y = (pantalla_alto // 2) - (alto // 2)
    ventana.geometry(f"{ancho}x{alto}+{x}+{y}")

app = tk.Tk()
app.title("Scraper de Google Maps con Emails y Redes")
centrar_ventana(app, 600, 550)


frame = tk.Frame(app, padx=10, pady=10)
frame.pack(fill=tk.BOTH, expand=True)

label_tiempo = tk.Label(frame, text="Tiempo transcurrido: 00:00 | Estimado total: 00:00 | Restante: 00:00", anchor='w')
label_tiempo.pack(fill='x', pady=(5, 0))

tk.Label(frame, text="Ubicación de origen (separadas por ;):").pack(anchor='w')
entry_ubicacion = tk.Entry(frame, width=50)
entry_ubicacion.pack(fill='x')

tk.Label(frame, text="Términos de búsqueda (separados por coma o punto y coma):").pack(anchor='w', pady=(10, 0))
text_terminos = tk.Text(frame, height=5)
text_terminos.pack(fill='both')

label_radio = tk.Label(frame, text="Radio de búsqueda en km (opcional):")
label_radio.pack(anchor='w', pady=(10, 0))
entry_radio = tk.Entry(frame, width=20)
entry_radio.pack(fill='x')

label_max_resultados = tk.Label(frame, text="Máximo de resultados por búsqueda (opcional):")
label_max_resultados.pack(anchor='w', pady=(10, 0))
entry_max_resultados = tk.Entry(frame, width=20)
entry_max_resultados.pack(fill='x')

label_estado = tk.Label(frame, text="Estado: esperando...", anchor='w')
label_estado.pack(fill='x', pady=(10, 0))

barra_progreso = ttk.Progressbar(frame, orient='horizontal', length=100, mode='determinate')
barra_progreso.pack(fill='x', pady=(5, 0))

label_total_resultados = tk.Label(frame, text="Total encontrados: 0", anchor='w')
label_total_resultados.pack(fill='x')
label_emails_bs = tk.Label(frame, text="Emails con BeautifulSoup: 0", anchor='w')
label_emails_bs.pack(fill='x')
label_redes_bs = tk.Label(frame, text="Redes con BeautifulSoup: 0", anchor='w')
label_redes_bs.pack(fill='x')
label_redes_tipo = tk.Label(frame, text="FB: 0 | IG: 0 | TW: 0 | LI: 0 | TT: 0", anchor='w')
label_redes_tipo.pack(fill='x')

def get_max_results():
    valor = entry_max_resultados.get().strip()
    return int(valor) if valor.isdigit() else None

def should_continue_scraping(current_count, max_results_ubicacion):
    return max_results_ubicacion is None or current_count < max_results_ubicacion

def iniciar_busqueda_segura():
    btn_ejecutar.config(state='disabled')
    barra_progreso.config(value=0)
    label_estado.config(text="Estado: esperando...")
    threading.Thread(target=ejecutar_scraping).start()

def ejecutar_scraping():
    global total_resultados, emails_bs_count, redes_bs_count, redes_por_tipo
    total_resultados = 0
    emails_bs_count = 0
    redes_bs_count = 0
    redes_por_tipo = {
        'facebook': 0,
        'instagram': 0,
        'twitter': 0,
        'linkedin': 0,
        'tiktok': 0
    }

    label_total_resultados.config(text="Total encontrados: 0")
    label_emails_bs.config(text="Emails con BeautifulSoup: 0")
    label_redes_bs.config(text="Redes con BeautifulSoup: 0")
    label_redes_tipo.config(text="FB: 0 | IG: 0 | TW: 0 | LI: 0 | TT: 0")
    barra_progreso['value'] = 0
    app.update_idletasks()

    ubicaciones_raw = entry_ubicacion.get().strip()
    terminos_raw = text_terminos.get("1.0", tk.END).strip()
    max_resultados_global = get_max_results()

    if not ubicaciones_raw or not terminos_raw:
        messagebox.showerror("Error", "Debes completar todos los campos de ubicación y términos de búsqueda.")
        btn_ejecutar.config(state='normal')
        return

    lista_ubicaciones = [ubicacion.strip() for ubicacion in ubicaciones_raw.split(';') if ubicacion.strip()]
    query_terminos = [t.strip() for t in re.split(r'[;,]', terminos_raw) if t.strip()]
    num_ubicaciones = len(lista_ubicaciones)
    resultados_globales = []

    for idx_ubicacion, ubicacion_origen in enumerate(lista_ubicaciones):
        label_estado.config(text=f"Estado: Buscando en '{ubicacion_origen}'...")
        app.update_idletasks()

        lugares_encontrados_ubicacion = []
        total_resultados_ubicacion = 0
        max_resultados_ubicacion = max_resultados_global

        try:
            origen_geocode = gmaps.geocode(ubicacion_origen)
            if not origen_geocode:
                messagebox.showerror("Error", f"No se pudo geocodificar la ubicación: {ubicacion_origen}")
                continue
            origen_coords = (
                origen_geocode[0]['geometry']['location']['lat'],
                origen_geocode[0]['geometry']['location']['lng']
            )
        except Exception as e:
            messagebox.showerror("Error", f"Error al geocodificar '{ubicacion_origen}': {e}")
            continue

        for idx_termino, query_busqueda in enumerate(query_terminos):
            paginas = 0
            radio_km = entry_radio.get().strip()
            try:
                radio_metros = int(float(radio_km) * 1000) if radio_km else None
            except:
                radio_metros = None

            if radio_metros:
                respuesta = gmaps.places(query=query_busqueda, location=origen_coords, radius=radio_metros)
            else:
                respuesta = gmaps.places(query=query_busqueda, location=origen_coords)

            while respuesta and paginas < 3:
                if 'results' in respuesta:
                    for idx_lugar, lugar in enumerate(respuesta['results']):
                        if not should_continue_scraping(total_resultados_ubicacion, max_resultados_ubicacion):
                            break

                        place_id = lugar.get('place_id')
                        nombre = lugar.get('name', 'N/A')
                        direccion = lugar.get('formatted_address', 'N/A')
                        rating = lugar.get('rating', 'N/A')
                        opiniones = lugar.get('user_ratings_total', 0)
                        lat = lugar['geometry']['location']['lat']
                        lng = lugar['geometry']['location']['lng']
                        distancia_km = round(geodesic(origen_coords, (lat, lng)).kilometers, 2)

                        try:
                            detalles = gmaps.place(place_id=place_id)
                            result_detalle = detalles.get('result', {})
                            telefono = result_detalle.get('formatted_phone_number', 'N/A')
                            sitio_web = result_detalle.get('website', 'N/A')
                        except:
                            telefono = 'Error'
                            sitio_web = 'Error'

                        emails, redes_sociales = scrape_web_info(sitio_web)

                        lugar_limpio = {
                            'Ubicación de Búsqueda': ubicacion_origen,
                            'Radio (km)': radio_km if radio_km else '',
                            'Término de Búsqueda': query_busqueda,
                            'Nombre': nombre if nombre != 'N/A' else '',
                            'Dirección': direccion if direccion != 'N/A' else '',
                            'Teléfono': telefono if telefono != 'N/A' and telefono != 'Error' else '',
                            'Sitio Web': sitio_web if sitio_web != 'N/A' and sitio_web != 'Error' else '',
                            'Emails': ", ".join(emails),
                            'Redes Sociales': ", ".join(redes_sociales),
                            'Rating Google': rating if rating != 'N/A' else '',
                            'Opiniones Google': opiniones if opiniones else '',
                            'Distancia (km)': distancia_km if distancia_km else ''
                        }
                        lugares_encontrados_ubicacion.append(lugar_limpio)
                        total_resultados += 1
                        total_resultados_ubicacion += 1
                        if emails:
                            emails_bs_count += 1
                        if redes_sociales:
                            redes_bs_count += 1
                            for red in redes_sociales:
                                for tipo_red, count in redes_por_tipo.items():
                                    if tipo_red in red:
                                        redes_por_tipo[tipo_red] += 1
                                        break

                        label_total_resultados.config(text=f"Total encontrados: {total_resultados}")
                        label_emails_bs.config(text=f"Emails con BeautifulSoup: {emails_bs_count}")
                        label_redes_bs.config(text=f"Redes con BeautifulSoup: {redes_bs_count}")
                        label_redes_tipo.config(text=f"FB: {redes_por_tipo['facebook']} | IG: {redes_por_tipo['instagram']} | TW: {redes_por_tipo['twitter']} | LI: {redes_por_tipo['linkedin']} | TT: {redes_por_tipo['tiktok']}")
                        app.update_idletasks()

                        total_esperado_global = num_ubicaciones * len(query_terminos) * (max_resultados_global if max_resultados_global else 20 * 3)
                        if total_esperado_global > 0:
                            progreso = (total_resultados / total_esperado_global) * 100
                            barra_progreso['value'] = min(progreso, 100)
                            app.update_idletasks()

                    if not should_continue_scraping(total_resultados_ubicacion, max_resultados_ubicacion):
                        break

                paginas += 1
                if 'next_page_token' in respuesta:
                    time.sleep(2.5)
                    respuesta = gmaps.places(query=query_busqueda, location=origen_coords, page_token=respuesta['next_page_token'])
                else:
                    break
            if not should_continue_scraping(total_resultados_ubicacion, max_resultados_ubicacion):
                break

        resultados_globales.extend(lugares_encontrados_ubicacion)

    if resultados_globales:
        df = pd.DataFrame(resultados_globales)
        archivo = filedialog.asksaveasfilename(defaultextension=".xlsx", filetypes=[("Excel files", "*.xlsx")])
        if archivo:
            df.to_excel(archivo, index=False, engine='openpyxl')
            messagebox.showinfo("Éxito", f"Resultados guardados en: {archivo}")
        label_estado.config(text="Proceso finalizado. Puedes comenzar una nueva búsqueda.")
        btn_ejecutar.config(state='normal')
        barra_progreso['value'] = 0
    else:
        label_estado.config(text="Sin resultados en ninguna ubicación. Puedes intentar otra búsqueda.")
        btn_ejecutar.config(state='normal')
        barra_progreso['value'] = 0
        messagebox.showinfo("Sin resultados", "No se encontraron datos para guardar.")

def volver_al_menu():
    app.destroy()
    subprocess.Popen([sys.executable, "main.py"])

btn_ejecutar = tk.Button(frame, text="Iniciar búsqueda", command=iniciar_busqueda_segura)
btn_ejecutar.pack(pady=10)

btn_volver = tk.Button(frame, text="Volver al menú principal", command=volver_al_menu)
btn_volver.pack(pady=5)

app.mainloop()
