import type { Group } from "@/types/note"
import { loadNotes, saveNotes } from "./notes"

// Load groups from localStorage
export const loadGroups = (): Group[] => {
  if (typeof window === "undefined") return []
  const groups = localStorage.getItem("groups")
  return groups ? JSON.parse(groups) : []
}

// Save groups to localStorage
export const saveGroups = (groups: Group[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("groups", JSON.stringify(groups))
}

// Add a new group
export const addGroup = (name: string): Group => {
  const groups = loadGroups()
  const id = name.toLowerCase().replace(/\s+/g, "-")

  // Check if group already exists
  if (groups.some((g) => g.id === id)) {
    return groups.find((g) => g.id === id)!
  }

  const newGroup: Group = { id, name }
  groups.push(newGroup)
  saveGroups(groups)
  return newGroup
}

// Delete a group
export const deleteGroup = (id: string): void => {
  const groups = loadGroups()
  const filtered = groups.filter((group) => group.id !== id)
  saveGroups(filtered)

  // Also remove this group from all notes
  const notes = loadNotes()
  const updatedNotes = notes.map((note) => ({
    ...note,
    groups: note.groups ? note.groups.filter((g) => g !== id) : [],
  }))
  saveNotes(updatedNotes)
}

// Get notes for a specific group
export const getNotesForGroup = (groupId: string) => {
  const notes = loadNotes()
  return notes.filter((note) => note.groups && note.groups.includes(groupId))
}

// Get recent notes for a group (limited to count)
export const getRecentNotesForGroup = (groupId: string, count = 3) => {
  const groupNotes = getNotesForGroup(groupId)
  return groupNotes.sort((a, b) => b.lastModified - a.lastModified).slice(0, count)
}

