export interface TestQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number // Index of the correct answer in options array
}

export interface TestSet {
  id: string
  title: string
  questions: TestQuestion[]
  source?: string // Source note ID if created from a note
  topic?: string // Store the detected topic
  language?: string // Keep the language field
}

