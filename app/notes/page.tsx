"use client"

import { useState, useEffect } from "react"
import { Plus, Settings, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { loadSettings } from "@/lib/settings"
import { loadNotes } from "@/lib/notes"
import { loadGroups, getRecentNotesForGroup } from "@/lib/groups"
import { useRouter } from "next/navigation"
import type { Note, Group } from "@/types/note"
import TabBar from "@/components/tab-bar"

export default function NotesPage() {
  const [settings, setSettings] = useState({ color1: "#ffffff", color2: "#ffffff", useBW: true })
  const [searchQuery, setSearchQuery] = useState("")
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)
  const [isNewNoteLoading, setIsNewNoteLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedSettings = loadSettings()
        setSettings(savedSettings)

        const savedNotes = loadNotes()
        setNotes(savedNotes)

        const savedGroups = loadGroups()
        setGroups(savedGroups)

        setTimeout(() => {
          setLoaded(true)
        }, 100)
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()
  }, [])

  const gradientTextStyle = {
    backgroundImage: settings.useBW ? "none" : `linear-gradient(to right, ${settings.color1}, ${settings.color2})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: settings.useBW ? "white" : "transparent",
    color: settings.useBW ? "white" : "transparent",
    display: "inline-block",
  }

  const gradientElementStyle = {
    backgroundImage: settings.useBW ? "none" : `linear-gradient(to right, ${settings.color1}, ${settings.color2})`,
    backgroundColor: settings.useBW ? "white" : "transparent",
    color: settings.useBW ? "black" : "white",
  }

  const getTagStyle = (tag: string) => {
    if (settings.useBW) {
      return {
        border: "2px solid white",
        backgroundColor: "transparent",
        color: "white",
      }
    }

    return {
      position: "relative" as const,
      padding: "2px",
      borderRadius: "9999px",
      backgroundImage: `linear-gradient(to right, ${settings.color1}, ${settings.color2})`,
    }
  }

  const getTagInnerStyle = () => {
    return {
      backgroundColor: "#000",
      borderRadius: "9999px",
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0.5rem 1.25rem",
    }
  }

  const handleNewNote = () => {
    setIsNewNoteLoading(true)
    setIsNavigating(true)
    setTimeout(() => {
      router.push("/notes/new")
    }, 300)
  }

  const handleOpenNote = (id: string) => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push(`/notes/${id}`)
    }, 300)
  }

  const handleSettingsClick = () => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push("/settings")
    }, 300)
  }

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  const handleSeeAllGroups = () => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push("/groups")
    }, 300)
  }

  const handleSeeAllGroupNotes = (groupId: string) => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push(`/groups/${groupId}`)
    }, 300)
  }

  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags || [])))

  const getSnippet = (content: string): string => {
    if (!content) return ""

    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        const textParts: string[] = []

        for (const node of parsed) {
          if (node && node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
              if (child && typeof child.text === "string") {
                textParts.push(child.text)
              }
            }
          }

          if (textParts.join(" ").length > 100) break
        }

        const snippet = textParts.join(" ")
        return snippet.substring(0, 100) + (snippet.length > 100 ? "..." : "")
      }
      return ""
    } catch (e) {
      return typeof content === "string" ? content.substring(0, 100) + (content.length > 100 ? "..." : "") : ""
    }
  }

  const handleSeeAllNotes = () => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push("/notes/all")
    }, 300)
  }

  return (
    <div
      className={`min-h-screen bg-black text-white transition-opacity duration-300 ${isNavigating ? "opacity-0" : "opacity-100"}`}
    >
      <div className={`p-4 flex items-center gap-4 ${loaded ? "fade-in" : "opacity-0"}`}>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search from notes or tags..."
            className="w-full bg-[#1c1c1e] text-white rounded-full py-3 px-6 focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{
              focusRing: settings.useBW ? "white" : `${settings.color1}`,
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="p-3 bg-[#1c1c1e] rounded-full" onClick={handleSettingsClick}>
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <div className={`px-4 py-2 overflow-x-auto flex gap-3 no-scrollbar ${loaded ? "fade-in-delay-1" : "opacity-0"}`}>
        {allTags.length > 0 ? (
          allTags.map((tag) =>
            settings.useBW ? (
              <div
                key={tag}
                className="rounded-full px-6 py-2 whitespace-nowrap"
                style={{
                  border: "2px solid white",
                  backgroundColor: "transparent",
                }}
              >
                <span className="text-white">#{tag}</span>
              </div>
            ) : (
              <div key={tag} className="whitespace-nowrap" style={getTagStyle(tag)}>
                <div style={getTagInnerStyle()}>
                  <span style={gradientTextStyle}>#{tag}</span>
                </div>
              </div>
            ),
          )
        ) : (
          <div className="text-gray-500 italic">No tags yet</div>
        )}
      </div>

      <div className={`px-4 py-6 ${loaded ? "fade-in-delay-2" : "opacity-0"}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl" style={gradientTextStyle}>
            Recently opened
          </h2>
          <button
            className="bg-[#1c1c1e] px-4 py-2 rounded-full text-sm hover:bg-[#2c2c2e] transition-colors"
            onClick={handleSeeAllNotes}
          >
            See all
          </button>
        </div>
        <div className="space-y-4">
          {notes.length > 0 ? (
            [...notes]
              .sort((a, b) => b.lastModified - a.lastModified)
              .slice(0, 3)
              .map((note) => (
                <div
                  key={note.id}
                  className="rounded-3xl p-6 bg-[#1c1c1e] hover:bg-[#2c2c2e] transition-colors cursor-pointer"
                  onClick={() => handleOpenNote(note.id)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl">{note.title}</h3>
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
                </div>
              ))
          ) : (
            <div className="rounded-3xl p-6 bg-[#1c1c1e] text-center">
              <p className="text-gray-400">No notes yet. Create your first note!</p>
            </div>
          )}
        </div>
      </div>

      <div className={`px-4 py-6 mb-24 ${loaded ? "fade-in-delay-3" : "opacity-0"}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl" style={gradientTextStyle}>
            Groups
          </h2>
          <button
            className="bg-[#1c1c1e] px-4 py-2 rounded-full text-sm hover:bg-[#2c2c2e] transition-colors"
            onClick={handleSeeAllGroups}
          >
            See all
          </button>
        </div>

        <div className="space-y-4">
          {groups.length > 0 ? (
            groups.map((group) => (
              <div key={group.id} className="space-y-3">
                <div
                  className="rounded-3xl p-6 bg-[#1c1c1e] hover:bg-[#2c2c2e] transition-colors cursor-pointer flex justify-between items-center"
                  onClick={() => toggleGroupExpansion(group.id)}
                >
                  <h3 className="text-2xl">{group.name}</h3>
                  {expandedGroups[group.id] ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {expandedGroups[group.id] && (
                  <div className="pl-4 space-y-3 animate-in slide-in-from-top-5 duration-300 ease-in-out">
                    {getRecentNotesForGroup(group.id).map((note) => (
                      <div
                        key={note.id}
                        className="rounded-2xl p-5 bg-[#2c2c2e] hover:bg-[#3c3c3e] transition-colors cursor-pointer"
                        onClick={() => handleOpenNote(note.id)}
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-xl">{note.title}</h4>
                          <span className="text-gray-500 text-sm">
                            {new Date(note.lastModified).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}

                    <button
                      className="w-full py-3 rounded-2xl bg-[#2c2c2e] hover:bg-[#3c3c3e] transition-colors text-sm text-gray-400"
                      onClick={() => handleSeeAllGroupNotes(group.id)}
                    >
                      See all notes
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-3xl p-6 bg-[#1c1c1e] text-center">
              <p className="text-gray-400">No groups yet. Create your first group!</p>
            </div>
          )}
        </div>
      </div>

      <TabBar />

      <button
        className={`fixed right-6 bottom-24 p-4 rounded-full shadow-lg ${loaded ? "fade-in-delay-4" : "opacity-0"}`}
        style={gradientElementStyle}
        onClick={handleNewNote}
        disabled={isNewNoteLoading}
      >
        {isNewNoteLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Plus className="w-6 h-6" style={{ color: settings.useBW ? "black" : "white" }} />
        )}
      </button>
    </div>
  )
}

