"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { loadSettings } from "@/lib/settings"
import { loadGroups, getNotesForGroup } from "@/lib/groups"
import { useRouter } from "next/navigation"
import type { Group } from "@/types/note"
import TabBar from "@/components/tab-bar"

export default function GroupsPage() {
  const [settings, setSettings] = useState({ color1: "#ffffff", color2: "#ffffff", useBW: true })
  const [searchQuery, setSearchQuery] = useState("")
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const savedSettings = loadSettings()
    setSettings(savedSettings)

    // Load groups
    const savedGroups = loadGroups()
    setGroups(savedGroups)

    // Set loaded after a small delay to trigger animations
    setTimeout(() => {
      setLoaded(true)
    }, 100)
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

  const handleGroupClick = (groupId: string) => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push(`/groups/${groupId}`)
    }, 300)
  }

  // Filter groups based on search query
  const filteredGroups = groups.filter((group) => group.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div
      className={`min-h-screen bg-black text-white transition-opacity duration-300 ${isNavigating ? "opacity-0" : "opacity-100"}`}
    >
      {/* Header */}
      <div
        className={`p-4 flex items-center transition-all duration-500 transform ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <button className="p-2 rounded-full hover:bg-[#1c1c1e]" onClick={handleBackClick}>
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold ml-4" style={gradientTextStyle}>
          All Groups
        </h1>
      </div>

      {/* Search Bar */}
      <div
        className={`p-4 transition-all duration-500 transform ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="relative">
          <input
            type="text"
            placeholder="Search groups..."
            className="w-full bg-[#1c1c1e] text-white rounded-full py-3 px-6 focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{
              focusRing: settings.useBW ? "white" : `${settings.color1}`,
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Groups List */}
      <div
        className={`px-4 py-2 pb-24 space-y-4 transition-all duration-500 transform ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => {
            const noteCount = getNotesForGroup(group.id).length
            return (
              <div
                key={group.id}
                className="rounded-3xl p-6 bg-[#1c1c1e] hover:bg-[#2c2c2e] transition-colors cursor-pointer"
                onClick={() => handleGroupClick(group.id)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl">{group.name}</h3>
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-2">{noteCount} notes</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-3xl p-6 bg-[#1c1c1e] text-center">
            <p className="text-gray-400">
              {searchQuery ? "No matching groups found." : "No groups yet. Create your first group!"}
            </p>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <TabBar />
    </div>
  )
}

