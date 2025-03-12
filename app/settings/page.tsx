"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { loadSettings, saveSettings } from "@/lib/settings"
import { ColorPicker } from "@/components/color-picker"
import TabBar from "@/components/tab-bar"

export default function SettingsPage() {
  const [color1, setColor1] = useState("#ffffff")
  const [color2, setColor2] = useState("#ffffff")
  const [useBW, setUseBW] = useState(true) // Default to B&W
  const [isGradientOpen, setIsGradientOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("color1")
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)

  // Load settings
  useEffect(() => {
    const savedSettings = loadSettings()
    setColor1(savedSettings.color1)
    setColor2(savedSettings.color2)
    setUseBW(savedSettings.useBW)

    // Set loaded after a small delay to trigger animations
    setTimeout(() => {
      setLoaded(true)
    }, 100)
  }, [])

  // Save settings when changed
  useEffect(() => {
    saveSettings({ color1, color2, useBW })
  }, [color1, color2, useBW])

  const handleBackClick = () => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push("/notes")
    }, 300)
  }

  const toggleGradientPicker = () => {
    setIsGradientOpen(!isGradientOpen)
  }

  // Gradient border style
  const gradientBorderStyle = useBW
    ? {
        border: "2px solid white",
        borderRadius: "0.75rem",
      }
    : {
        padding: "2px",
        borderRadius: "0.75rem",
        background: `linear-gradient(to right, ${color1}, ${color2})`,
      }

  return (
    <div
      className={`min-h-screen bg-black text-white transition-opacity duration-300 ${isNavigating ? "opacity-0" : "opacity-100"}`}
    >
      {/* Header */}
      <div className={`p-4 flex items-center ${loaded ? "fade-in" : "opacity-0"}`}>
        <button className="p-2 rounded-full hover:bg-[#1c1c1e]" onClick={handleBackClick}>
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold ml-4">Settings</h1>
      </div>

      {/* Settings Content */}
      <div className="p-4 space-y-6 pb-24">
        {/* Gradient Settings */}
        <div className={`space-y-4 ${loaded ? "fade-in-delay-1" : "opacity-0"}`}>
          <div
            className="bg-[#1c1c1e] rounded-xl p-4 flex justify-between items-center cursor-pointer"
            onClick={toggleGradientPicker}
          >
            <span className="text-lg font-medium">Change gradient (experimental)</span>
            {isGradientOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Expandable Gradient Picker */}
          {isGradientOpen && (
            <div className="space-y-4">
              {/* Tabs with gradient border */}
              <div
                style={
                  useBW
                    ? { border: "2px solid white", borderRadius: "0.75rem" }
                    : {
                        padding: "2px",
                        borderRadius: "0.75rem",
                        background: `linear-gradient(to right, ${color1}, ${color2})`,
                      }
                }
              >
                <div className="flex relative rounded-[calc(0.75rem-2px)] overflow-hidden bg-[#1c1c1e] h-10">
                  <button
                    className={`flex-1 py-2 px-4 z-10 transition-colors duration-300 ${activeTab === "color1" ? "text-black" : "text-white"}`}
                    onClick={() => setActiveTab("color1")}
                  >
                    Color 1
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 z-10 transition-colors duration-300 ${activeTab === "color2" ? "text-black" : "text-white"}`}
                    onClick={() => setActiveTab("color2")}
                  >
                    Color 2
                  </button>

                  {/* Animated background for active tab */}
                  <div
                    className="absolute top-0 bottom-0 w-1/2 bg-white rounded-md transition-all duration-300 ease-in-out"
                    style={{
                      left: activeTab === "color1" ? "0%" : "50%",
                    }}
                  />
                </div>
              </div>

              {/* Color Picker with gradient border */}
              <div
                style={
                  useBW
                    ? { border: "2px solid white", borderRadius: "0.75rem" }
                    : {
                        padding: "2px",
                        borderRadius: "0.75rem",
                        background: `linear-gradient(to right, ${color1}, ${color2})`,
                      }
                }
              >
                <div className="flex justify-center bg-[#1c1c1e] p-6 rounded-[calc(0.75rem-2px)]">
                  {activeTab === "color1" ? (
                    <ColorPicker color={color1} onChange={setColor1} disabled={useBW} />
                  ) : (
                    <ColorPicker color={color2} onChange={setColor2} disabled={useBW} />
                  )}
                </div>
              </div>

              {/* B&W Toggle with gradient border */}
              <div
                style={
                  useBW
                    ? { border: "2px solid white", borderRadius: "0.75rem" }
                    : {
                        padding: "2px",
                        borderRadius: "0.75rem",
                        background: `linear-gradient(to right, ${color1}, ${color2})`,
                      }
                }
              >
                <div className="flex items-center justify-between bg-[#1c1c1e] p-4 rounded-[calc(0.75rem-2px)]">
                  <span>Use B&W</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={useBW}
                      onChange={(e) => setUseBW(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-black after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Other Settings (Placeholders) */}
        <div className={`space-y-4 ${loaded ? "fade-in-delay-2" : "opacity-0"}`}>
          <div className="bg-[#1c1c1e] rounded-xl p-4 flex justify-between items-center">
            <span className="text-lg font-medium">Notifications</span>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>

          <div className="bg-[#1c1c1e] rounded-xl p-4 flex justify-between items-center">
            <span className="text-lg font-medium">Privacy</span>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>

          <div className="bg-[#1c1c1e] rounded-xl p-4 flex justify-between items-center">
            <span className="text-lg font-medium">About</span>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <TabBar />
    </div>
  )
}

