import os
import re
import requests
import subprocess
import sys
import tkinter as tk
from tkinter import messagebox, filedialog, ttk
from bs4 import BeautifulSoup
from serpapi import GoogleSearch
from dotenv import load_dotenv
import pandas as pd
import threading

# --- Cargar API Key ---
load_dotenv()
serp_api_key = os.getenv("SERP_API_KEY")
if not serp_api_key:
    messagebox.showerror("Error", "No se encontró la variable SERP_API_KEY.")
    sys.exit()

# --- Países e idiomas ---
paises_gl = {
    "🇦🇷 Argentina": "ar", "🇧🇷 Brasil": "br", "🇨🇱 Chile": "cl", "🇨🇴 Colombia": "co", "🇲🇽 México": "mx",
    "🇵🇪 Perú": "pe", "🇺🇾 Uruguay": "uy", "🇻🇪 Venezuela": "ve", "🇪🇸 España": "es", "🇫🇷 Francia": "fr",
    "🇮🇹 Italia": "it", "🇩🇪 Alemania": "de", "🇵🇹 Portugal": "pt", "🇬🇧 Reino Unido": "uk", "🇺🇸 Estados Unidos": "us",
    "🌍 Otro": ""
}
idiomas_hl = {
    "Español": "es", "Inglés": "en", "Francés": "fr", "Alemán": "de", "Italiano": "it", "Portugués": "pt", "Otro": ""
}

# --- Scraping de emails desde sitio ---
def extract_info_from_html(html):
    return list(set(re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html)))

def scrape_site(url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
        response = requests.get(url, timeout=10, headers=headers)
        if response.status_code != 200:
            return []
        return extract_info_from_html(response.text)
    except:
        return []

# --- Centrar ventana ---
def centrar_ventana(win, ancho=700, alto=600):
    win.update_idletasks()
    x = (win.winfo_screenwidth() // 2) - (ancho // 2)
    y = (win.winfo_screenheight() // 2) - (alto // 2)
    win.geometry(f"{ancho}x{alto}+{x}+{y}")

def volver_al_menu():
    app.destroy()
    subprocess.Popen(f'"{sys.executable}" main.py', shell=True)

# --- Interfaz ---
app = tk.Tk()
app.title("Scraper SerpApi – Emails")
centrar_ventana(app)

frame = tk.Frame(app, padx=10, pady=10)
frame.pack(fill=tk.BOTH, expand=True)

tk.Label(frame, text="Query de búsqueda:").pack(anchor='w')
entry_query = tk.Entry(frame, width=80)
entry_query.pack()

tk.Label(frame, text="Cantidad de resultados deseados (máx 300):").pack(anchor='w')
entry_limit = tk.Entry(frame, width=10)
entry_limit.insert(0, "100")
entry_limit.pack()

tk.Label(frame, text="Ubicación simulada (ej: Lima, Perú):").pack(anchor='w')
entry_location = tk.Entry(frame, width=80)
entry_location.insert(0, "Madrid, España")
entry_location.pack()

tk.Label(frame, text="País (gl):").pack(anchor='w')
selected_gl = tk.StringVar(value=list(paises_gl.keys())[0])
ttk.Combobox(frame, textvariable=selected_gl, values=list(paises_gl.keys()), state="readonly").pack()

tk.Label(frame, text="Idioma (hl):").pack(anchor='w')
selected_hl = tk.StringVar(value=list(idiomas_hl.keys())[0])
ttk.Combobox(frame, textvariable=selected_hl, values=list(idiomas_hl.keys()), state="readonly").pack()

label_estado = tk.Label(frame, text="Estado: esperando...", anchor='w')
label_estado.pack(fill='x')

barra_progreso = ttk.Progressbar(frame, orient='horizontal', length=100, mode='determinate')
barra_progreso.pack(fill='x', pady=(5, 0))

label_total = tk.Label(frame, text="Total resultados: 0", anchor='w')
label_total.pack(fill='x')
label_emails = tk.Label(frame, text="Con email: 0", anchor='w')
label_emails.pack(fill='x')

def ejecutar_busqueda():
    btn_buscar.config(state='disabled')
    threading.Thread(target=procesar_busqueda).start()

def procesar_busqueda():
    query = entry_query.get().strip()
    location = entry_location.get().strip()
    gl = paises_gl[selected_gl.get()]
    hl = idiomas_hl[selected_hl.get()]
    try:
        limit = min(int(entry_limit.get()), 300)
    except:
        limit = 100

    if not query:
        messagebox.showerror("Error", "Ingresa una consulta de búsqueda.")
        btn_buscar.config(state='normal')
        return

    total = 0
    con_email = 0
    start = 0
    resultados = []

    label_estado.config(text="Buscando...")
    barra_progreso["value"] = 0
    app.update_idletasks()

    while total < limit:
        params = {
            "engine": "google",
            "q": query,
            "api_key": serp_api_key,
            "num": 100,
            "start": start,
            "location": location,
            "gl": gl,
            "hl": hl
        }
        search = GoogleSearch(params)
        resultados_api = search.get_dict().get("organic_results", [])
        if not resultados_api:
            break

        for r in resultados_api:
            if total >= limit:
                break
            title = r.get("title", "N/A")
            link = r.get("link", "N/A")
            snippet = r.get("snippet", "")
            emails_snippet = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', snippet + " " + title)
            emails_site = scrape_site(link)
            emails = list(set(emails_snippet + emails_site))
            if emails:
                con_email += 1
            resultados.append({
                "Query": query,
                "Título": title,
                "URL": link,
                "Emails": ", ".join(emails)
            })
            total += 1
            label_total.config(text=f"Total resultados: {total}")
            label_emails.config(text=f"Con email: {con_email}")
            barra_progreso["value"] = (total / limit) * 100
            app.update_idletasks()
        start += 100

    if resultados:
        df = pd.DataFrame(resultados)
        archivo = filedialog.asksaveasfilename(defaultextension=".xlsx", filetypes=[("Excel", "*.xlsx")])
        if archivo:
            df.to_excel(archivo, index=False, engine='openpyxl')
            messagebox.showinfo("Éxito", f"Guardado: {archivo}")
    else:
        messagebox.showinfo("Sin resultados", "No se encontró información para exportar.")

    btn_buscar.config(state='normal')
    label_estado.config(text="Listo.")
    barra_progreso["value"] = 0

btn_buscar = tk.Button(frame, text="Iniciar búsqueda", command=ejecutar_busqueda)
btn_buscar.pack(pady=10)

btn_volver = tk.Button(frame, text="Volver al menú principal", command=volver_al_menu)
btn_volver.pack()

app.mainloop()
