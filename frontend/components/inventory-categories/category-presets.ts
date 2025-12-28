export const colorPresets = [
  { name: "Rojo", value: "#ef4444" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#10b981" },
  { name: "Amarillo", value: "#f59e0b" },
  { name: "Purpura", value: "#8b5cf6" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Gris", value: "#6b7280" },
]

export const iconPresets = [
  { name: "Medicamento", value: "pill", emoji: "💊" },
  { name: "Jeringa", value: "syringe", emoji: "💉" },
  { name: "Venda", value: "bandage", emoji: "🩹" },
  { name: "Corazon", value: "heart", emoji: "❤️" },
  { name: "Estetoscopio", value: "stethoscope", emoji: "🩺" },
  { name: "Termometro", value: "thermometer", emoji: "🌡️" },
  { name: "Microscopio", value: "microscope", emoji: "🔬" },
  { name: "Tubo", value: "test-tube", emoji: "🧪" },
  { name: "Capsula", value: "capsule", emoji: "💊" },
  { name: "Mascara", value: "mask", emoji: "😷" },
  { name: "Guantes", value: "gloves", emoji: "🧤" },
  { name: "Tijeras", value: "scissors", emoji: "✂️" },
]

export function getIconEmoji(iconValue?: string): string {
  return iconPresets.find(icon => icon.value === iconValue)?.emoji || "📦"
}
