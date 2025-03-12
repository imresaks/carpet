// Simple function to detect if text is likely non-English
export const detectLanguage = (text: string): string => {
  // This is a very simple detection - just checking for non-ASCII characters
  // A more sophisticated approach would use a proper language detection library

  // Check for common non-Latin scripts
  const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text)
  if (hasJapanese) return "Japanese"

  const hasKorean = /[\uac00-\ud7af\u1100-\u11ff]/.test(text)
  if (hasKorean) return "Korean"

  const hasChinese = /[\u4e00-\u9fff]/.test(text)
  if (hasChinese) return "Chinese"

  const hasCyrillic = /[\u0400-\u04FF]/.test(text)
  if (hasCyrillic) return "Russian"

  const hasArabic = /[\u0600-\u06FF]/.test(text)
  if (hasArabic) return "Arabic"

  const hasHebrew = /[\u0590-\u05FF]/.test(text)
  if (hasHebrew) return "Hebrew"

  const hasDevanagari = /[\u0900-\u097F]/.test(text)
  if (hasDevanagari) return "Hindi"

  // Check for common European languages
  const hasEstonian = /[äöüõ]/i.test(text)
  if (hasEstonian) return "Estonian"

  const hasSpanishChars = /[áéíóúüñ¿¡]/i.test(text)
  if (hasSpanishChars) return "Spanish"

  const hasFrenchChars = /[àâçéèêëîïôùûüÿœæ]/i.test(text)
  if (hasFrenchChars) return "French"

  const hasGermanChars = /[äöüß]/i.test(text)
  if (hasGermanChars) return "German"

  // Default to English if no specific patterns are detected
  return "English"
}

