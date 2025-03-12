"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function WelcomeScreen() {
  const [displayText, setDisplayText] = useState("")
  const [showButtons, setShowButtons] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [typingPhase, setTypingPhase] = useState(0)
  const router = useRouter()

  // Typing effect with multiple phases
  useEffect(() => {
    let timeout: NodeJS.Timeout

    const phases = [
      { text: "Welcome", action: "type" },
      { text: "Welcome", action: "delete" },
      { text: "to", action: "type" },
      { text: "to", action: "delete" },
      { text: "FNote", action: "type" },
      { text: "FNote", action: "complete" },
    ]

    const currentPhase = phases[typingPhase]

    if (!currentPhase) return

    const typeSpeed = 150 // ms per character
    const deleteSpeed = 100 // ms per character (faster than typing)
    const pauseBeforeDelete = 800 // pause before starting to delete

    if (currentPhase.action === "type") {
      const currentIndex = displayText.length

      if (currentIndex < currentPhase.text.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentPhase.text.substring(0, currentIndex + 1))
        }, typeSpeed)
      } else {
        // Move to next phase after a pause
        timeout = setTimeout(() => {
          setTypingPhase(typingPhase + 1)
        }, pauseBeforeDelete)
      }
    } else if (currentPhase.action === "delete") {
      const currentIndex = displayText.length

      if (currentIndex > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.substring(0, currentIndex - 1))
        }, deleteSpeed)
      } else {
        // Move to next phase immediately after deletion is complete
        setTypingPhase(typingPhase + 1)
      }
    } else if (currentPhase.action === "complete") {
      // After typing completes, show buttons
      timeout = setTimeout(() => {
        setShowButtons(true)

        // After buttons appear, show skip option
        setTimeout(() => {
          setShowSkip(true)
        }, 800)
      }, 400)
    }

    return () => clearTimeout(timeout)
  }, [displayText, typingPhase])

  const handleNavigation = () => {
    setIsFadingOut(true)
    // Wait for fade out animation to complete before navigating
    setTimeout(() => {
      router.push("/notes")
    }, 600)
  }

  // These functions would be connected to real OAuth providers
  const handleGoogleSignIn = () => {
    // In a real implementation, this would redirect to Google OAuth
    handleNavigation()
  }

  const handleAppleSignIn = () => {
    // In a real implementation, this would redirect to Apple OAuth
    handleNavigation()
  }

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${isFadingOut ? "opacity-0" : "opacity-100"}`}
    >
      <div className="max-w-md w-full px-6 py-8 flex flex-col items-center">
        <h1
          className={`text-5xl md:text-6xl text-white font-serif italic mb-12 tracking-wide min-h-[80px] flex items-center transition-opacity duration-500 ${isFadingOut ? "opacity-0" : "opacity-100"}`}
        >
          {displayText}
          <span
            className={`ml-1 inline-block w-[3px] h-[50px] bg-white ${typingPhase === 5 ? "animate-pulse opacity-0" : "animate-pulse"}`}
          ></span>
        </h1>

        <div
          className={`w-full space-y-4 mb-8 transition-all duration-500 ${showButtons ? "opacity-100" : "opacity-0"} ${isFadingOut ? "opacity-0 transform translate-y-4" : ""}`}
        >
          <Button
            variant="outline"
            className="w-full py-6 flex items-center justify-center gap-2 bg-transparent border-white text-white hover:bg-white/10"
            onClick={handleGoogleSignIn}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-google"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
              <path d="M12 8v8" />
            </svg>
            Sign up with Google
          </Button>

          <Button
            variant="outline"
            className="w-full py-6 flex items-center justify-center gap-2 bg-transparent border-white text-white hover:bg-white/10"
            onClick={handleAppleSignIn}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-apple"
            >
              <path d="M12 20.94c1.5 0 2.75-.67 3.68-1.8 2.15-2.5 1.85-7.25-.3-11.36a.52.52 0 0 0-.33-.28.51.51 0 0 0-.42.07c-1.45.9-2.3 2.62-2.3 4.57 0 1.82.8 3.54 2.2 4.82.12.13.16.3.1.47-.06.15-.2.25-.36.25H14c-.27 0-.53-.24-.7-.5-.28-.4-.4-.84-.4-1.3 0-.84.4-1.64 1.15-2.12.12-.1.18-.28.13-.45a.33.33 0 0 0-.35-.25c-1.95 0-3.5 1.7-3.5 3.8 0 .94.35 1.8.92 2.4.5.6 1.17.97 1.88.97" />
              <path d="M13.45 12.63c-.24-3.17 2.33-6.7 5.1-7.33a.5.5 0 0 1 .3.06.5.5 0 0 1 .22.25c.84 2.47.3 5.5-1.67 9.38-1.38 2.73-3.16 3.96-4.62 3.96h-.12c-.25-.03-.4-.25-.4-.5 0-.1.03-.2.08-.3.43-.76.7-1.7.7-2.7 0-1.1-.18-2.18-.6-2.82Z" />
            </svg>
            Sign up with Apple
          </Button>
        </div>

        <button
          className={`text-gray-400 underline text-sm hover:text-gray-300 transition-all duration-1000 ${showSkip ? "opacity-100" : "opacity-0"} ${isFadingOut ? "opacity-0 transform translate-y-4" : ""}`}
          onClick={handleNavigation}
        >
          Use app offline, skip signing up
        </button>
      </div>
    </div>
  )
}

