// At the top of the file, add these imports:
import { detectTopic } from "./topic-utils"
import { detectLanguage } from "./language-utils"

// Type definition for flash card stats
export interface FlashCardStats {
  remembered: number[]
  notRemembered: number[]
}

// Update the FlashCard interface to use strings instead of React elements
export interface FlashCard {
  id: number
  front: string
  back: string
}

export interface FlashCardSet {
  id: string
  title: string
  cards: FlashCard[]
  source?: string // Source note ID if created from a note
  topic?: string // Store the detected topic
  language?: string // Keep the language field
}

// Save flash card stats to localStorage
export const saveFlashCardStats = (stats: Record<string, FlashCardStats>): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("flashCardStats", JSON.stringify(stats))
  }
}

// Load flash card stats from localStorage
export const loadFlashCardStats = (): Record<string, FlashCardStats> => {
  if (typeof window !== "undefined") {
    const savedStats = localStorage.getItem("flashCardStats")
    if (savedStats) {
      return JSON.parse(savedStats)
    }
  }
  return {}
}

// Save flash card sets to localStorage
export const saveFlashCardSets = (sets: FlashCardSet[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("flashCardSets", JSON.stringify(sets))
  }
}

// Load flash card sets from localStorage
export const loadFlashCardSets = (): FlashCardSet[] => {
  if (typeof window !== "undefined") {
    const savedSets = localStorage.getItem("flashCardSets")
    if (savedSets) {
      return JSON.parse(savedSets)
    }
  }
  return []
}

// Helper function to safely extract JSON from text with multiple fallback strategies
const extractJsonFromText = (text: string): any => {
  console.log("Attempting to extract JSON from text:", text.substring(0, 200) + "...")

  // Try multiple approaches to extract valid JSON

  // Approach 1: Try to parse the entire text as JSON
  try {
    return JSON.parse(text)
  } catch (e) {
    console.log("Failed to parse entire text as JSON, trying other approaches")
  }

  // Approach 2: Try to find JSON array with regex
  try {
    const jsonArrayMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/)
    if (jsonArrayMatch) {
      return JSON.parse(jsonArrayMatch[0])
    }
  } catch (e) {
    console.log("Failed to extract JSON array with regex")
  }

  // Approach 3: Try to manually extract JSON objects
  try {
    // Look for patterns that might indicate JSON objects
    const manualExtraction = text.match(/\[\s*(\{[^{}]*\}(?:\s*,\s*\{[^{}]*\})*)\s*\]/)
    if (manualExtraction && manualExtraction[1]) {
      return JSON.parse(`[${manualExtraction[1]}]`)
    }
  } catch (e) {
    console.log("Failed manual extraction attempt")
  }

  // Approach 4: Create cards from text directly if it contains question-like patterns
  if (text.includes("?")) {
    try {
      const lines = text.split(/\n+/)
      const cards = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line.includes("?")) {
          const front = line
          const back = lines[i + 1]?.trim() || "No answer provided"
          cards.push({ front, back })
          i++ // Skip the next line as we used it for the answer
        }
      }

      if (cards.length > 0) {
        console.log("Created cards from text patterns:", cards.length)
        return cards
      }
    } catch (e) {
      console.log("Failed to create cards from text patterns")
    }
  }

  // Final fallback: Create a simple array with default cards
  console.log("All JSON extraction methods failed, using fallback cards")
  return [
    {
      front: "The AI couldn't generate proper flash cards",
      back: "Please try again with more detailed content in your note",
    },
    {
      front: "How to get better flash cards?",
      back: "Add more detailed information to your note and try again",
    },
  ]
}

// Create a simpler version of the API call that doesn't rely on complex JSON parsing
export const generateFlashCards = async (
  noteContent: string,
  noteTitle: string,
  noteId: string,
  count: number,
  difficulty: number,
): Promise<FlashCardSet | null> => {
  try {
    // Extract text from Slate format
    let textContent = ""
    try {
      const parsed = JSON.parse(noteContent)
      if (Array.isArray(parsed)) {
        parsed.forEach((block) => {
          if (block.children && Array.isArray(block.children)) {
            block.children.forEach((child) => {
              if (child.text) {
                textContent += child.text + " "
              }
            })
            textContent += "\n"
          }
        })
      }
    } catch (e) {
      // If parsing fails, use the content as is
      textContent = noteContent
    }

    if (!textContent.trim()) {
      console.error("No text content to generate flash cards from")
      return createErrorSet(noteId, noteTitle, "No content to generate flash cards from")
    }

    // Detect the topic and language of the original text
    const detectedTopic = detectTopic(textContent)
    const detectedLanguage = detectLanguage(textContent)
    console.log(`Detected topic: ${detectedTopic}, language: ${detectedLanguage}`)

    // Prepare the prompt based on difficulty and language
    const difficultyLabels = ["easy", "medium", "hard"]
    const difficultyLabel = difficultyLabels[difficulty]

    // Customize Q/A prefixes based on language
    let qPrefix = "Q:"
    let aPrefix = "A:"

    // Set language-specific prefixes for common languages
    if (detectedLanguage === "Estonian") {
      qPrefix = "K:" // Küsimus
      aPrefix = "V:" // Vastus
    } else if (detectedLanguage === "Spanish") {
      qPrefix = "P:" // Pregunta
      aPrefix = "R:" // Respuesta
    } else if (detectedLanguage === "French") {
      qPrefix = "Q:" // Question
      aPrefix = "R:" // Réponse
    } else if (detectedLanguage === "German") {
      qPrefix = "F:" // Frage
      aPrefix = "A:" // Antwort
    } else if (detectedLanguage === "Russian") {
      qPrefix = "В:" // Вопрос
      aPrefix = "О:" // Ответ
    } else if (detectedLanguage === "Chinese") {
      qPrefix = "问:" // 问题
      aPrefix = "答:" // 答案
    } else if (detectedLanguage === "Japanese") {
      qPrefix = "質:" // 質問
      aPrefix = "答:" // 答え
    }

    // Strongly emphasize generating content in the original language
    const prompt = `
      Create ${count} flash cards based on the following text. 
      Each flash card should have a question on the front and the answer on the back.
      Make the questions ${difficultyLabel} difficulty.
      
      VERY IMPORTANT: You MUST generate the flash cards in EXACTLY THE SAME LANGUAGE as the original text.
      The original text appears to be in ${detectedLanguage}.
      DO NOT translate to English or any other language. Keep the original language.
      
      Format each card as "${qPrefix} [question]" on one line followed by "${aPrefix} [answer]" on the next line.
      Leave a blank line between each card.
      
      Text: ${textContent}
    `

    console.log("Sending prompt to Gemini API...")

    // Call the Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCWdtwc5bIzW3iXFFn66Pto2Qmz_srLz4E",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API request failed with status ${response.status}:`, errorText)
      return createErrorSet(noteId, noteTitle, `API request failed: ${response.status}`)
    }

    const data = await response.json()

    // Extract the text from the response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      console.error("No text generated from API:", data)
      return createErrorSet(noteId, noteTitle, "No text generated from API")
    }

    console.log("Received response from Gemini API:", generatedText.substring(0, 100) + "...")

    // Parse the response in a simpler format (Q/A pairs)
    const cards: FlashCard[] = []
    const lines = generatedText.split("\n")

    let currentQuestion = ""

    // Handle different Q/A prefixes based on detected language
    const qRegex = new RegExp(`^${qPrefix.replace(":", "\\s*:?\\s*")}\\s*(.+)`, "i")
    const aRegex = new RegExp(`^${aPrefix.replace(":", "\\s*:?\\s*")}\\s*(.+)`, "i")

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      const qMatch = line.match(qRegex)
      if (qMatch) {
        currentQuestion = qMatch[1].trim()
        continue
      }

      const aMatch = line.match(aRegex)
      if (aMatch && currentQuestion) {
        const answer = aMatch[1].trim()
        cards.push({
          id: cards.length + 1,
          front: currentQuestion,
          back: answer,
        })
        currentQuestion = ""
      }
    }

    // If we couldn't parse any cards in the Q/A format, try JSON extraction as fallback
    if (cards.length === 0) {
      console.log("No cards found in Q/A format, trying JSON extraction")
      try {
        const extractedCards = extractJsonFromText(generatedText)
        extractedCards.forEach((card: any, index: number) => {
          cards.push({
            id: index + 1,
            front: card.front || card.question || "Missing question",
            back: card.back || card.answer || "Missing answer",
          })
        })
      } catch (e) {
        console.error("Failed to extract cards from response:", e)
      }
    }

    // If we still have no cards, create a default set
    if (cards.length === 0) {
      return createErrorSet(noteId, noteTitle, "Failed to generate cards from the response")
    }

    // Create the flash card set
    const flashCardSet: FlashCardSet = {
      id: `note-${noteId}-${Date.now()}`,
      title: noteTitle || "Untitled Note",
      source: noteId,
      topic: detectedTopic,
      language: detectedLanguage,
      cards: cards,
    }

    // Save the new set
    const existingSets = loadFlashCardSets()
    saveFlashCardSets([...existingSets, flashCardSet])

    return flashCardSet
  } catch (error) {
    console.error("Error generating flash cards:", error)
    return createErrorSet(noteId, noteTitle, `Error: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Helper function to create an error flash card set
const createErrorSet = (noteId: string, noteTitle: string, errorMessage: string): FlashCardSet => {
  const errorSet: FlashCardSet = {
    id: `note-${noteId}-${Date.now()}`,
    title: `${noteTitle || "Untitled Note"} (Error)`,
    source: noteId,
    topic: "General",
    language: "English",
    cards: [
      {
        id: 1,
        front: "Error generating flash cards",
        back: `There was an error: ${errorMessage}. Please try again later.`,
      },
    ],
  }

  // Save the error set
  const existingSets = loadFlashCardSets()
  saveFlashCardSets([...existingSets, errorSet])

  return errorSet
}

