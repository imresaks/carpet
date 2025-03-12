"use client"

import { useState, useEffect } from "react"
import { BookOpen, Square, ClipboardCheck } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { loadSettings } from "@/lib/settings"

export default function TabBar() {
  const [settings, setSettings] = useState({ color1: "#ffffff", color2: "#ffffff", useBW: false })
  const [activeTab, setActiveTab] = useState("notes")
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const savedSettings = loadSettings()
    setSettings(savedSettings)
  }, [])

  useEffect(() => {
    // Determine active tab based on pathname
    if (pathname.includes("/flash-cards")) {
      setActiveTab("flash-cards")
    } else if (pathname.includes("/tests")) {
      setActiveTab("tests")
    } else {
      setActiveTab("notes")
    }
  }, [pathname])

  const handleNavigate = (path: string, tab: string) => {
    if (activeTab === tab) return
    setActiveTab(tab)
    router.push(path)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#1c1c1e] border-t border-gray-800 flex justify-around items-center px-6 z-50">
      <div className="flex w-full justify-around">
        {/* Tab buttons - no indicator, just opacity differences */}
        <button
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-300 ${
            activeTab === "notes" ? "text-white" : "text-gray-500"
          }`}
          onClick={() => handleNavigate("/notes", "notes")}
        >
          <BookOpen className="w-6 h-6" />
          <span className="text-sm">Notes</span>
        </button>

        <button
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-300 ${
            activeTab === "flash-cards" ? "text-white" : "text-gray-500"
          }`}
          onClick={() => handleNavigate("/flash-cards", "flash-cards")}
        >
          <Square className="w-6 h-6" />
          <span className="text-sm">Flash Cards</span>
        </button>

        <button
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-300 ${
            activeTab === "tests" ? "text-white" : "text-gray-500"
          }`}
          onClick={() => handleNavigate("/tests", "tests")}
        >
          <ClipboardCheck className="w-6 h-6" />
          <span className="text-sm">Tests</span>
        </button>
      </div>
    </div>
  )
}

