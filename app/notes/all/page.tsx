"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Trash2 } from "lucide-react"
import { loadSettings } from "@/lib/settings"
import { loadNotes, saveNotes } from "@/lib/notes"
import { useRouter } from "next/navigation"
import type { Note } from "@/types/note"
import TabBar from "@/components/tab-bar"

export default function AllNotesPage() {
  const [settings, setSettings] = useState({ color1: "#ffffff", color2: "#ffffff", useBW: false })
  const [searchQuery, setSearchQuery] = useState("")
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])

  // Animation states
  const [showHeader, setShowHeader] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  useEffect(() => {
    const savedSettings = loadSettings()
    setSettings(savedSettings)

    // Load actual notes
    const savedNotes = loadNotes()
    setNotes(savedNotes)

    // Staggered animations
    setTimeout(() => setShowHeader(true), 100)
    setTimeout(() => setShowSearch(true), 300)
    setTimeout(() => setShowNotes(true), 500)
  }, [])

  // Generate gradient styles for text
  const gradientTextStyle = {
    backgroundImage: settings.useBW ? "none" : `linear-gradient(to right, ${settings.color1}, ${settings.color2})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: settings.useBW ? "white" : "transparent",
    color: settings.useBW ? "white" : "transparent",
    display: "inline-block",
  }

  const handleBackClick = () => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push("/notes")
    }, 300)
  }

  const handleOpenNote = (id: string) => {
    if (isSelectionMode) {
      toggleNoteSelection(id)
    } else {
      setIsNavigating(true)
      setTimeout(() => {
        router.push(`/notes/${id}`)
      }, 300)
    }
  }

  const handleLongPress = (id: string) => {
    setIsSelectionMode(true)
    setSelectedNotes([id])
  }

  const toggleNoteSelection = (id: string) => {
    setSelectedNotes((prev) => {
      if (prev.includes(id)) {
        return prev.filter((noteId) => noteId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const handleCancelSelection = () => {
    setIsSelectionMode(false)
    setSelectedNotes([])
  }

  const handleDeleteSelected = () => {
    // Filter out the selected notes
    const updatedNotes = notes.filter((note) => !selectedNotes.includes(note.id))
    setNotes(updatedNotes)
    saveNotes(updatedNotes)

    // Exit selection mode
    setIsSelectionMode(false)
    setSelectedNotes([])
  }

  // Function to get a snippet from the note content
  const getSnippet = (content: string): string => {
    if (!content) return ""

    try {
      // Try to parse the content as JSON (Slate format)
      const parsed = JSON.parse(content)
      // Extract text from the first paragraph
      if (Array.isArray(parsed)) {
        const textParts: string[] = []

        // Loop through nodes to extract text
        for (const node of parsed) {
          if (node && node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
              if (child && typeof child.text === "string") {
                textParts.push(child.text)
              }
            }
          }

          // If we have enough text for a snippet, break
          if (textParts.join(" ").length > 100) break
        }

        const snippet = textParts.join(" ")
        return snippet.substring(0, 100) + (snippet.length > 100 ? "..." : "")
      }
      return ""
    } catch (e) {
      // If parsing fails, return a substring of the content
      return typeof content === "string" ? content.substring(0, 100) + (content.length > 100 ? "..." : "") : ""
    }
  }

  // Filter notes based on search query
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSnippet(note.content).toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div
      className={`min-h-screen bg-black text-white transition-opacity duration-300 ${isNavigating ? "opacity-0" : "opacity-100"}`}
    >
      {/* Header */}
      <div
        className={`p-4 flex items-center justify-between transition-all duration-500 transform ${
          showHeader ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-[#1c1c1e]" onClick={handleBackClick}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-bold ml-4" style={gradientTextStyle}>
            All Notes
          </h1>
        </div>

        {isSelectionMode && <div className="text-sm text-gray-400">{selectedNotes.length} selected</div>}
      </div>

      {/* Search Bar */}
      <div
        className={`p-4 transition-all duration-500 transform ${
          showSearch ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="relative">
          <input
            type="text"
            placeholder="Search notes..."
            className="w-full bg-[#1c1c1e] text-white rounded-full py-3 px-6 focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{
              focusRing: settings.useBW ? "white" : `${settings.color1}`,
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Notes List */}
      <div
        className={`px-4 py-2 pb-24 space-y-4 transition-all duration-500 transform ${
          showNotes ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`rounded-3xl p-6 bg-[#1c1c1e] hover:bg-[#2c2c2e] transition-colors cursor-pointer ${
                selectedNotes.includes(note.id) ? "border-2 border-white scale-[1.02]" : ""
              }`}
              onClick={() => handleOpenNote(note.id)}
              onContextMenu={(e) => {
                e.preventDefault()
                handleLongPress(note.id)
              }}
              onTouchStart={() => {
                const timer = setTimeout(() => {
                  handleLongPress(note.id)
                }, 800)
                return () => clearTimeout(timer)
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  {isSelectionMode && (
                    <div
                      className={`w-6 h-6 rounded-md mr-3 flex items-center justify-center ${
                        selectedNotes.includes(note.id) ? "bg-white" : "border border-gray-500"
                      }`}
                    >
                      {selectedNotes.includes(note.id) && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-black"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                  <h3 className="text-2xl">{note.title}</h3>
                </div>
                <span className="text-gray-500 text-sm">
                  {new Date(note.lastModified).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-gray-400">{getSnippet(note.content)}</p>
              {note.tags && note.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <span key={tag} className="text-sm text-gray-400 bg-[#2c2c2e] px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-3xl p-6 bg-[#1c1c1e] text-center">
            <p className="text-gray-400">
              {searchQuery ? "No matching notes found." : "No notes yet. Create your first note!"}
            </p>
          </div>
        )}
      </div>

      {/* Selection Mode Toolbar */}
      {isSelectionMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1c1c1e] border-t border-gray-800 p-4 flex justify-between items-center animate-in slide-in-from-bottom duration-300">
          <button className="px-6 py-3 rounded-full bg-[#2c2c2e] text-white" onClick={handleCancelSelection}>
            Cancel
          </button>

          <button
            className="px-6 py-3 rounded-full bg-red-900/30 text-red-300 border border-red-800/50 flex items-center gap-2"
            onClick={handleDeleteSelected}
            disabled={selectedNotes.length === 0}
          >
            <Trash2 className="w-5 h-5" />
            Delete
          </button>
        </div>
      )}

      {/* Tab Bar - only show when not in selection mode */}
      {!isSelectionMode && <TabBar />}
    </div>
  )
}

