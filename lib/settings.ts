// Type definition for app settings
export interface AppSettings {
  color1: string
  color2: string
  useBW: boolean
}

// Default settings
export const defaultSettings: AppSettings = {
  color1: "#ffffff", // White
  color2: "#ffffff", // White
  useBW: true, // Default to B&W mode
}

// Save settings to localStorage
export const saveSettings = (settings: AppSettings): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("appSettings", JSON.stringify(settings))
  }
}

// Load settings from localStorage
export const loadSettings = (): AppSettings => {
  if (typeof window !== "undefined") {
    const savedSettings = localStorage.getItem("appSettings")
    if (savedSettings) {
      return JSON.parse(savedSettings)
    }
  }
  return defaultSettings
}

