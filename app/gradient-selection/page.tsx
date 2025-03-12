"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/color-picker"
import { useRouter } from "next/navigation"

export default function GradientSelection() {
  const [color1, setColor1] = useState("#ffffff")
  const [color2, setColor2] = useState("#ffffff")
  const [useBW, setUseBW] = useState(false)
  const [activeTab, setActiveTab] = useState("color1")
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  // Animation states
  const [showTitle, setShowTitle] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showToggle, setShowToggle] = useState(false)
  const [showButton, setShowButton] = useState(false)

  // Save settings to localStorage (simulating a JSON file)
  useEffect(() => {
    const settings = {
      color1,
      color2,
      useBW,
    }
    localStorage.setItem("appSettings", JSON.stringify(settings))
  }, [color1, color2, useBW])

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("appSettings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setColor1(settings.color1)
      setColor2(settings.color2)
      setUseBW(settings.useBW)
    }
  }, [])

  // Staggered entrance animations
  useEffect(() => {
    // Sequence the animations
    setTimeout(() => setShowTitle(true), 100)
    setTimeout(() => setShowColorPicker(true), 400)
    setTimeout(() => setShowToggle(true), 700)
    setTimeout(() => setShowButton(true), 900)
  }, [])

  const handleBWToggle = (checked: boolean) => {
    setUseBW(checked)
  }

  const handleContinue = () => {
    setIsNavigating(true)
    // Wait for fade out animation to complete before navigating
    setTimeout(() => {
      router.push("/notes")
    }, 600)
  }

  // Gradient style for text
  const gradientTextStyle = {
    background: useBW ? "white" : `linear-gradient(to right, ${color1}, ${color2})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: useBW ? "white" : "transparent",
    paddingBottom: "0.1em", // Fix text cutoff issue
  }

  // Gradient style for borders
  const gradientBorderStyle = useBW
    ? {
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: "white",
        borderRadius: "1rem", // Rounder borders
      }
    : {
        borderWidth: "2px",
        borderStyle: "solid",
        borderImageSource: `linear-gradient(to right, ${color1}, ${color2})`,
        borderImageSlice: 1,
      }

  return (
    <div
      className={`min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 transition-opacity duration-500 ${isNavigating ? "opacity-0" : "opacity-100"}`}
    >
      <div className="max-w-2xl w-full">
        <h1
          className={`text-4xl md:text-5xl font-serif italic mb-8 text-center transition-all duration-700 transform ${showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={gradientTextStyle}
        >
          Choose a gradient you like
        </h1>

        <div
          className={`rounded-xl border border-white/20 p-6 mb-8 bg-black/50 backdrop-blur-sm transition-all duration-700 transform ${showColorPicker ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <p className="text-center mb-8 text-gray-300">This affects the app's user interface</p>

          <div className={`mb-8 ${useBW ? "opacity-50 pointer-events-none" : ""}`}>
            <Tabs defaultValue="color1" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div
                className="p-1 rounded-xl mb-6 overflow-hidden"
                style={useBW ? { ...gradientBorderStyle } : { borderRadius: "1rem" }}
              >
                <TabsList className="grid w-full grid-cols-2 relative">
                  <TabsTrigger value="color1" className="z-10 transition-colors duration-300">
                    Color 1
                  </TabsTrigger>
                  <TabsTrigger value="color2" className="z-10 transition-colors duration-300">
                    Color 2
                  </TabsTrigger>

                  {/* Animated background for active tab */}
                  <div
                    className="absolute top-0 bottom-0 w-1/2 bg-white rounded-md transition-all duration-300 ease-in-out"
                    style={{
                      left: activeTab === "color1" ? "0%" : "50%",
                    }}
                  />
                </TabsList>
              </div>
              <TabsContent value="color1" className="flex justify-center">
                <ColorPicker color={color1} onChange={setColor1} disabled={useBW} />
              </TabsContent>
              <TabsContent value="color2" className="flex justify-center">
                <ColorPicker color={color2} onChange={setColor2} disabled={useBW} />
              </TabsContent>
            </Tabs>
          </div>

          <div
            className={`flex items-center justify-between border-t border-white/10 pt-6 transition-all duration-700 ${showToggle ? "opacity-100" : "opacity-0"}`}
          >
            <div className="flex items-center space-x-2">
              <Label htmlFor="bw-mode" className="text-white">
                Use B&W
              </Label>
              <Switch id="bw-mode" checked={useBW} onCheckedChange={handleBWToggle} />
            </div>
          </div>
        </div>

        <div
          className={`w-full transition-all duration-700 transform ${showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {useBW ? (
            <Button
              className="w-full py-6 text-lg bg-black text-white relative overflow-hidden rounded-xl hover:text-black transition-colors duration-300"
              onClick={handleContinue}
            >
              <span
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  ...gradientBorderStyle,
                }}
              ></span>
              <span className="relative z-10">Continue</span>

              {/* Hover background with matching rounded corners */}
              <span className="absolute inset-[2px] bg-transparent hover:bg-white transition-colors duration-300 rounded-[calc(0.75rem-2px)]" />
            </Button>
          ) : (
            <div
              className="relative w-full rounded-xl overflow-hidden"
              style={{
                background: `linear-gradient(to right, ${color1}, ${color2})`,
                padding: "2px",
                borderRadius: "0.75rem",
              }}
            >
              <Button
                className="w-full py-6 text-lg bg-black text-white hover:text-black transition-colors duration-300 rounded-[calc(0.75rem-2px)]"
                onClick={handleContinue}
              >
                <span className="relative z-10">Continue</span>

                {/* Hover background with matching rounded corners */}
                <span className="absolute inset-0 bg-transparent hover:bg-white transition-colors duration-300 rounded-[calc(0.75rem-2px)]" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

