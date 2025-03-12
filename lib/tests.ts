import type { TestSet, TestQuestion } from "@/types/test"
import { detectTopic } from "./topic-utils"
import { detectLanguage } from "./language-utils"

/**
 * Load test sets from localStorage
 * @returns Array of test sets
 */
export function loadTestSets(): TestSet[] {
  if (typeof window !== "undefined") {
    const savedSets = localStorage.getItem("testSets")
    if (savedSets) {
      return JSON.parse(savedSets)
    }
  }
  return []
}

/**
 * Save test sets to localStorage
 * @param sets Array of test sets to save
 */
export function saveTestSets(sets: TestSet[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("testSets", JSON.stringify(sets))
  }
}

/**
 * Generate test questions from note content
 * @param noteContent Content of the note
 * @param noteTitle Title of the note
 * @param noteId ID of the note
 * @param count Number of questions to generate
 * @param difficulty Difficulty level (0: Easy, 1: Medium, 2: Hard)
 * @returns Promise resolving to a TestSet or null
 */
export async function generateTestQuestions(
  noteContent: string,
  noteTitle: string,
  noteId: string,
  count: number,
  difficulty: number,
): Promise<TestSet | null> {
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
      console.error("No text content to generate test questions from")
      return createErrorTestSet(noteId, noteTitle, "No content to generate test questions from")
    }

    // Detect the topic and language of the content
    const detectedTopic = detectTopic(textContent)
    const detectedLanguage = detectLanguage(textContent)
    console.log(`Detected topic: ${detectedTopic}, language: ${detectedLanguage}`)

    // Prepare the prompt based on difficulty and language
    const difficultyLabels = ["easy", "medium", "hard"]
    const difficultyLabel = difficultyLabels[difficulty]

    // Strongly emphasize generating content in the original language
    const prompt = `
      Create ${count} multiple-choice questions based on the following text. 
      Each question should have 4 options with only one correct answer.
      Make the questions ${difficultyLabel} difficulty.
      
      VERY IMPORTANT: You MUST generate the questions in EXACTLY THE SAME LANGUAGE as the original text.
      The original text appears to be in ${detectedLanguage}.
      DO NOT translate to English or any other language. Keep the original language.
      
      Format each question as:
      Q: [question]
      A: [option 1]
      B: [option 2]
      C: [option 3]
      D: [option 4]
      Correct: [A, B, C, or D]
      
      Leave a blank line between each question.
      
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
      return createErrorTestSet(noteId, noteTitle, `API request failed: ${response.status}`)
    }

    const data = await response.json()

    // Extract the text from the response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      console.error("No text generated from API:", data)
      return createErrorTestSet(noteId, noteTitle, "No text generated from API")
    }

    console.log("Received response from Gemini API:", generatedText.substring(0, 100) + "...")

    // Parse the response to extract questions
    const questions = parseMultipleChoiceQuestions(generatedText)

    // If we couldn't parse any questions, return an error set
    if (questions.length === 0) {
      return createErrorTestSet(noteId, noteTitle, "Failed to parse questions from the response")
    }

    // Create the test set
    const testSet: TestSet = {
      id: `note-${noteId}-${Date.now()}`,
      title: noteTitle || "Untitled Note",
      source: noteId,
      topic: detectedTopic,
      language: detectedLanguage,
      questions: questions,
    }

    // Save the new set
    const existingSets = loadTestSets()
    saveTestSets([...existingSets, testSet])

    return testSet
  } catch (error) {
    console.error("Error generating test questions:", error)
    return createErrorTestSet(noteId, noteTitle, `Error: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Parse multiple choice questions from text
 * @param text Text to parse
 * @returns Array of parsed questions
 */
function parseMultipleChoiceQuestions(text: string): TestQuestion[] {
  const questions: TestQuestion[] = []
  const questionBlocks = text.split(/\n\s*\n/)

  for (const block of questionBlocks) {
    try {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line)

      if (lines.length < 6) continue // Need at least question, 4 options, and correct answer

      const questionMatch = lines[0].match(/^Q:\s*(.+)/)
      if (!questionMatch) continue

      const question = questionMatch[1]

      const options: string[] = []
      let correctAnswerIndex = -1

      for (let i = 1; i <= 4; i++) {
        if (i >= lines.length) break

        const optionMatch = lines[i].match(/^([A-D]):\s*(.+)/)
        if (!optionMatch) continue

        const optionLetter = optionMatch[1]
        const optionText = optionMatch[2]
        options.push(optionText)

        // Check if this is the correct answer
        const correctLine = lines.find((line) => line.startsWith("Correct:"))
        if (correctLine) {
          const correctMatch = correctLine.match(/Correct:\s*([A-D])/)
          if (correctMatch && correctMatch[1] === optionLetter) {
            correctAnswerIndex = i - 1
          }
        }
      }

      // If we couldn't determine the correct answer, try another approach
      if (correctAnswerIndex === -1) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes("Correct:")) {
            const match = lines[i].match(/Correct:\s*([A-D])/)
            if (match) {
              const letter = match[1]
              correctAnswerIndex = "ABCD".indexOf(letter)
            }
          }
        }
      }

      // Only add if we have a valid question with options and a correct answer
      if (question && options.length === 4 && correctAnswerIndex >= 0) {
        questions.push({
          id: questions.length + 1,
          question,
          options,
          correctAnswer: correctAnswerIndex,
        })
      }
    } catch (e) {
      console.error("Error parsing question block:", e)
      // Continue to the next block
    }
  }

  return questions
}

/**
 * Create an error test set
 * @param noteId ID of the note
 * @param noteTitle Title of the note
 * @param errorMessage Error message
 * @returns Error test set
 */
function createErrorTestSet(noteId: string, noteTitle: string, errorMessage: string): TestSet {
  const errorSet: TestSet = {
    id: `note-${noteId}-${Date.now()}`,
    title: `${noteTitle || "Untitled Note"} (Error)`,
    source: noteId,
    topic: "General",
    language: "English",
    questions: [
      {
        id: 1,
        question: "Error generating test questions",
        options: [
          `There was an error: ${errorMessage}`,
          "Please try again later",
          "Check your note content",
          "Contact support if the issue persists",
        ],
        correctAnswer: 0,
      },
    ],
  }

  // Save the error set
  const existingSets = loadTestSets()
  saveTestSets([...existingSets, errorSet])

  return errorSet
}

