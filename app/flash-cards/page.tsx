"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { loadSettings } from "@/lib/settings"
import { useRouter } from "next/navigation"
import { loadFlashCardStats, saveFlashCardStats, loadFlashCardSets, type FlashCardSet } from "@/lib/flash-cards"
import TabBar from "@/components/tab-bar"

export default function FlashCardsPage() {
  const [settings, setSettings] = useState({ color1: "#ffffff", color2: "#ffffff", useBW: false })
  const [searchQuery, setSearchQuery] = useState("")
  const [isNavigating, setIsNavigating] = useState(false)
  const [selectedSet, setSelectedSet] = useState<FlashCardSet | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [stats, setStats] = useState<Record<string, { remembered: number[]; notRemembered: number[] }>>({})
  const [flashCardSets, setFlashCardSets] = useState<FlashCardSet[]>([])
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const savedSettings = loadSettings()
    setSettings(savedSettings)

    // Load flash card stats
    const savedStats = loadFlashCardStats()
    setStats(savedStats)

    // Load flash card sets
    const savedSets = loadFlashCardSets()
    setFlashCardSets(savedSets)

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

  // Generate gradient styles for buttons/elements
  const gradientElementStyle = {
    backgroundImage: settings.useBW ? "none" : `linear-gradient(to right, ${settings.color1}, ${settings.color2})`,
    backgroundColor: settings.useBW ? "white" : "transparent",
    color: settings.useBW ? "black" : "white",
  }

  const handleSettingsClick = () => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push("/settings")
    }, 300)
  }

  const handleSelectSet = (set: FlashCardSet) => {
    setSelectedSet(set)
    setCurrentCardIndex(0)
  }

  const handleBackToSets = () => {
    setSelectedSet(null)
  }

  const handleNextCard = () => {
    if (selectedSet && currentCardIndex < selectedSet.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    }
  }

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    }
  }

  const handleCardSwipe = (direction: "left" | "right") => {
    if (!selectedSet) return

    // Update stats
    const cardId = selectedSet.cards[currentCardIndex].id
    const setId = selectedSet.id

    // Initialize stats for this set if they don't exist
    if (!stats[setId]) {
      stats[setId] = { remembered: [], notRemembered: [] }
    }

    if (direction === "right") {
      // Card was remembered
      if (!stats[setId].remembered.includes(cardId)) {
        stats[setId].remembered.push(cardId)
        // Remove from not remembered if it was there
        stats[setId].notRemembered = stats[setId].notRemembered.filter((id) => id !== cardId)
      }
    } else {
      // Card was not remembered
      if (!stats[setId].notRemembered.includes(cardId)) {
        stats[setId].notRemembered.push(cardId)
        // Remove from remembered if it was there
        stats[setId].remembered = stats[setId].remembered.filter((id) => id !== cardId)
      }
    }

    // Save stats
    saveFlashCardStats(stats)
    setStats({ ...stats })

    // Move to next card
    if (currentCardIndex < selectedSet.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    }
  }

  // Filter flash card sets based on search query
  const filteredSets = flashCardSets.filter((set) => set.title.toLowerCase().includes(searchQuery.toLowerCase()))

  // Flash Card Stack component
  const FlashCardStack = () => {
    if (!selectedSet) return null

    // Get current and next card
    const currentCard = selectedSet.cards[currentCardIndex]
    const hasNextCard = currentCardIndex < selectedSet.cards.length - 1
    const nextCard = hasNextCard ? selectedSet.cards[currentCardIndex + 1] : null

    return (
      <div className="relative w-full h-[400px]">
        {/* Next card (shown underneath) */}
        {nextCard && (
          <div className="absolute inset-0 z-10">
            <div className="relative w-full h-[400px] bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="absolute inset-0 w-full h-full flex items-center justify-center p-8 text-center bg-[#1c1c1e]">
                <div className="text-xl">{nextCard.front}</div>
              </div>
            </div>
          </div>
        )}

        {/* Current card (on top) */}
        <div className="absolute inset-0 z-20">
          <SwipeableFlashCard card={currentCard} />
        </div>
      </div>
    )
  }

  // Custom FlashCard component with swipe functionality
  const SwipeableFlashCard = ({ card }: { card: any }) => {
    const [isFlipped, setIsFlipped] = useState(false)
    const [startX, setStartX] = useState(0)
    const [offsetX, setOffsetX] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [swipeDirection, setSwipeDirection] = useState<"none" | "left" | "right">("none")
    const [isExiting, setIsExiting] = useState(false)
    const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null)
    const cardRef = useRef<HTMLDivElement>(null)

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault() // Prevent default to avoid text selection
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      setStartX(clientX)
      setIsDragging(true)
    }

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDragging) return

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const diff = clientX - startX
      setOffsetX(diff)

      if (diff > 50) {
        setSwipeDirection("right")
      } else if (diff < -50) {
        setSwipeDirection("left")
      } else {
        setSwipeDirection("none")
      }
    }

    const handleTouchEnd = () => {
      if (!isDragging) return

      if (offsetX > 100) {
        // Swiped right - remembered
        setExitDirection("right")
        setIsExiting(true)

        // Animate the card out
        setTimeout(() => {
          handleCardSwipe("right")
          setIsExiting(false)
          setExitDirection(null)
          setOffsetX(0)
        }, 300) // Match the animation duration
      } else if (offsetX < -100) {
        // Swiped left - not remembered
        setExitDirection("left")
        setIsExiting(true)

        // Animate the card out
        setTimeout(() => {
          handleCardSwipe("left")
          setIsExiting(false)
          setExitDirection(null)
          setOffsetX(0)
        }, 300) // Match the animation duration
      } else {
        // Not swiped far enough, reset position
        setOffsetX(0)
      }

      setSwipeDirection("none")
      setIsDragging(false)
    }

    const handleCardClick = (e: React.MouseEvent) => {
      // Only flip the card if we're not dragging
      if (!isDragging || Math.abs(offsetX) < 10) {
        setIsFlipped(!isFlipped)
      }
    }

    // Calculate background gradient based on swipe direction
    let backgroundStyle = {}
    if (swipeDirection === "right") {
      const intensity = Math.min(1, Math.abs(offsetX) / 200)
      backgroundStyle = {
        background: `linear-gradient(to right, transparent, rgba(0, 255, 0, ${intensity * 0.5}))`,
      }
    } else if (swipeDirection === "left") {
      const intensity = Math.min(1, Math.abs(offsetX) / 200)
      backgroundStyle = {
        background: `linear-gradient(to left, transparent, rgba(255, 0, 0, ${intensity * 0.5}))`,
      }
    }

    // Calculate exit animation styles
    let exitStyle = {}
    if (isExiting) {
      const direction = exitDirection === "right" ? 1 : -1
      exitStyle = {
        transform: `translateX(${direction * window.innerWidth}px) rotate(${direction * 30}deg)`,
        opacity: 0,
        transition: "transform 300ms ease-out, opacity 300ms ease-out",
      }
    }

    return (
      <div
        ref={cardRef}
        className="relative w-full h-[400px] bg-[#1c1c1e] rounded-xl overflow-hidden cursor-pointer shadow-lg"
        style={{
          transform: isExiting ? "" : `translateX(${offsetX}px) rotate(${offsetX * 0.05}deg)`,
          transition: offsetX === 0 && !isExiting ? "transform 0.3s ease" : "none",
          ...exitStyle,
        }}
        onClick={handleCardClick}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Gradient overlay for swipe direction */}
        {swipeDirection !== "none" && (
          <div className="absolute inset-0 z-30 pointer-events-none" style={backgroundStyle}></div>
        )}

        <div
          className="absolute inset-0 w-full h-full backface-hidden transition-transform duration-500 flex items-center justify-center p-8 text-center bg-[#1c1c1e]"
          style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0)" }}
        >
          <div className="text-xl">{card.front}</div>
        </div>
        <div
          className="absolute inset-0 w-full h-full backface-hidden transition-transform duration-500 flex items-center justify-center p-8 text-center bg-[#2c2c2e]"
          style={{ transform: isFlipped ? "rotateY(0)" : "rotateY(180deg)" }}
        >
          <div className="text-xl">{card.back}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-black text-white transition-opacity duration-300 ${isNavigating ? "opacity-0" : "opacity-100"}`}
    >
      {/* Only show search bar and settings when no set is selected */}
      {!selectedSet && (
        <div className={`p-4 flex items-center gap-4 ${loaded ? "fade-in" : "opacity-0"}`}>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search from flash cards..."
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
      )}

      {/* Main Content */}
      <div className={`px-4 py-6 ${!selectedSet ? "pb-24" : "h-screen"}`}>
        {selectedSet ? (
          <div className="h-full flex flex-col">
            {/* Flash Card Set Header */}
            <div className="flex items-center mb-6">
              <button className="mr-4 p-2 rounded-full hover:bg-[#1c1c1e]" onClick={handleBackToSets}>
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-3xl" style={gradientTextStyle}>
                  {selectedSet.title}
                </h2>
                <div className="flex gap-2 text-sm text-gray-400">
                  {selectedSet.topic && <span>{selectedSet.topic}</span>}
                  {selectedSet.language && selectedSet.language !== "English" && (
                    <span className="ml-2">{selectedSet.language}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-6 flex justify-between items-center">
              <div className="text-gray-400">
                {currentCardIndex + 1}/{selectedSet.cards.length}
              </div>
              <div className="flex gap-4">
                <div className="text-green-500">Remembered: {stats[selectedSet.id]?.remembered.length || 0}</div>
                <div className="text-red-500">Not Remembered: {stats[selectedSet.id]?.notRemembered.length || 0}</div>
              </div>
            </div>

            {/* Flash Card Stack */}
            <div className="relative flex-grow flex items-center justify-center">
              <FlashCardStack />

              {/* Navigation Buttons */}
              <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-5">
                {currentCardIndex > 0 && (
                  <button className="p-2 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e]" onClick={handlePrevCard}>
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
              </div>
              <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-5">
                {currentCardIndex < selectedSet.cards.length - 1 && (
                  <button className="p-2 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e]" onClick={handleNextCard}>
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center text-gray-400 text-sm py-4">
              <p>Tap card to flip • Swipe right if you remember • Swipe left if you don't</p>
            </div>
          </div>
        ) : (
          <div>
            <h2 className={`text-4xl mb-6 ${loaded ? "fade-in-delay-1" : "opacity-0"}`} style={gradientTextStyle}>
              Flash Card Sets
            </h2>
            <div className={`space-y-4 ${loaded ? "fade-in-delay-2" : "opacity-0"}`}>
              {filteredSets.length > 0 ? (
                filteredSets.map((set) => (
                  <div
                    key={set.id}
                    className="rounded-3xl p-6 bg-[#1c1c1e] hover:bg-[#2c2c2e] transition-colors cursor-pointer"
                    onClick={() => handleSelectSet(set)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl text-left">{set.title}</h3>
                        <div className="flex gap-2 text-sm text-gray-400">
                          {set.topic && <span>{set.topic}</span>}
                          {set.language && set.language !== "English" && <span className="ml-2">{set.language}</span>}
                        </div>
                      </div>
                      <span className="text-gray-400">{set.cards.length} cards</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl p-6 bg-[#1c1c1e] text-center">
                  <p className="text-gray-400">
                    {searchQuery
                      ? "No matching flash card sets found."
                      : "No flash card sets yet. Create your first set from a note!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab Bar - only show when not viewing a flash card set */}
      {!selectedSet && <TabBar />}

      <style jsx global>{`
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  )
}

