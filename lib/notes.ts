import type { Note } from "@/types/note"

// Load notes from localStorage
export const loadNotes = (): Note[] => {
  if (typeof window === "undefined") return []
  const notes = localStorage.getItem("notes")
  return notes ? JSON.parse(notes) : []
}

// Save notes to localStorage
export const saveNotes = (notes: Note[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("notes", JSON.stringify(notes))
}

// Add or update a note
export const saveNote = (note: Note): void => {
  const notes = loadNotes()
  const index = notes.findIndex((n) => n.id === note.id)

  if (index >= 0) {
    notes[index] = note
  } else {
    notes.unshift(note) // Add new note to the beginning
  }

  saveNotes(notes)
}

// Delete a note
export const deleteNote = (id: string): void => {
  const notes = loadNotes()
  const filtered = notes.filter((note) => note.id !== id)
  saveNotes(filtered)
}

