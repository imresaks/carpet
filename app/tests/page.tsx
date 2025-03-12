"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Settings } from "lucide-react"
import { loadSettings } from "@/lib/settings"
import { loadTestSets, type TestSet } from "@/lib/tests"
import { useRouter } from "next/navigation"
import TabBar from "@/components/tab-bar"
import { Button } from "@/components/ui/button"

export default function TestsPage() {
  const [settings, setSettings] = useState({ color1: "#ffffff", color2: "#ffffff", useBW: true })
  const [searchQuery, setSearchQuery] = useState("")
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const [testSets, setTestSets] = useState<TestSet[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selectedSet, setSelectedSet] = useState<TestSet | null>(null)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0, percentage: 0 })

  useEffect(() => {
    const savedSettings = loadSettings()
    setSettings(savedSettings)

    // Load test sets
    const savedSets = loadTestSets()
    setTestSets(savedSets)

    // Set loaded after a small delay to trigger animations
    setTimeout(() => {
      setLoaded(true)
    }, 100)
  }, [])

  // Reset user answers when a new test set is selected
  useEffect(() => {
    if (selectedSet) {
      setUserAnswers(new Array(selectedSet.questions.length).fill(-1))
      setShowResults(false)
    }
  }, [selectedSet])

  // Generate gradient styles for text
  const gradientTextStyle = {
    backgroundImage: settings.useBW ? "none" : `linear-gradient(to right, ${settings.color1}, ${settings.color2})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: settings.useBW ? "white" : "transparent",
    color: settings.useBW ? "white" : "transparent",
    display: "inline-block",
  }

  const handleSettingsClick = () => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push("/settings")
    }, 300)
  }

  const handleSelectSet = (set: TestSet) => {
    setSelectedSet(set)
    setUserAnswers(new Array(set.questions.length).fill(-1))
    setShowResults(false)
  }

  const handleBackToSets = () => {
    setSelectedSet(null)
    setUserAnswers([])
    setShowResults(false)
  }

  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    if (showResults) return // Don't allow changing answers in results mode

    const newAnswers = [...userAnswers]
    newAnswers[questionIndex] = optionIndex
    setUserAnswers(newAnswers)
  }

  const handleShowResults = () => {
    if (!selectedSet) return

    // Calculate score
    let correctCount = 0
    for (let i = 0; i < selectedSet.questions.length; i++) {
      if (userAnswers[i] === selectedSet.questions[i].correctAnswer) {
        correctCount++
      }
    }

    const percentage = Math.round((correctCount / selectedSet.questions.length) * 100)
    setScore({
      correct: correctCount,
      total: selectedSet.questions.length,
      percentage,
    })

    setShowResults(true)
  }

  const handleRetakeTest = () => {
    if (!selectedSet) return
    setUserAnswers(new Array(selectedSet.questions.length).fill(-1))
    setShowResults(false)
  }

  // Filter test sets based on search query
  const filteredSets = testSets.filter((set) => set.title.toLowerCase().includes(searchQuery.toLowerCase()))

  // Check if all questions have been answered
  const allQuestionsAnswered = userAnswers.every((answer) => answer !== -1)

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
              placeholder="Search from tests..."
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
      <div className={`px-4 py-6 ${!selectedSet ? "pb-24" : "pb-32"}`}>
        {selectedSet ? (
          <div className="flex flex-col">
            {/* Test Set Header */}
            <div className="flex items-center mb-6">
              <button className="mr-4 p-2 rounded-full hover:bg-[#1c1c1e]" onClick={handleBackToSets}>
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-3xl" style={gradientTextStyle}>
                  {selectedSet.title}
                </h2>
                <div className="flex gap-2 text-sm text-gray-400">
                  {selectedSet.topic && <span>{selectedSet.topic}</span>}
                </div>

                {selectedSet.language && selectedSet.language !== "English" && (
                  <span className="text-sm text-gray-400 ml-2">{selectedSet.language}</span>
                )}
              </div>
            </div>

            {/* Score display in results mode */}
            {showResults && (
              <div className="bg-[#1c1c1e] rounded-xl p-4 mb-6">
                <h3 className="text-xl mb-2">Your Score</h3>
                <div className="flex items-center justify-between">
                  <span>
                    {score.correct} out of {score.total} correct
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      score.percentage >= 80
                        ? "text-green-500"
                        : score.percentage >= 60
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  >
                    {score.percentage}%
                  </span>
                </div>
              </div>
            )}

            {/* Test Content */}
            <div className="space-y-6 mb-24">
              {selectedSet.questions.map((question, index) => (
                <div key={question.id} className="bg-[#1c1c1e] rounded-xl p-4">
                  <h3 className="text-xl mb-4">
                    {index + 1}. {question.question}
                  </h3>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      // Determine the styling for each option
                      let optionClass = "p-3 rounded-lg cursor-pointer "

                      if (showResults) {
                        // In results mode
                        if (optionIndex === question.correctAnswer) {
                          // Correct answer
                          optionClass += "bg-green-800/20 border border-green-500/50"
                        } else if (userAnswers[index] === optionIndex) {
                          // User's incorrect answer
                          optionClass += "bg-red-800/20 border border-red-500/50"
                        } else {
                          // Other options
                          optionClass += "bg-[#2c2c2e]"
                        }
                      } else {
                        // In test mode
                        if (userAnswers[index] === optionIndex) {
                          // Selected answer
                          optionClass += "bg-[#3c3c3e] border border-white/50"
                        } else {
                          // Unselected answer
                          optionClass += "bg-[#2c2c2e] hover:bg-[#3c3c3e]"
                        }
                      }

                      return (
                        <div
                          key={optionIndex}
                          className={optionClass}
                          onClick={() => handleSelectAnswer(index, optionIndex)}
                        >
                          <span className="mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                          {option}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-gray-800">
              {showResults ? (
                <Button className="w-full py-6" onClick={handleRetakeTest}>
                  Retake Test
                </Button>
              ) : (
                <Button className="w-full py-6" onClick={handleShowResults} disabled={!allQuestionsAnswered}>
                  {allQuestionsAnswered ? "Show Results" : "Answer All Questions to Continue"}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <h2 className={`text-4xl mb-6 ${loaded ? "fade-in-delay-1" : "opacity-0"}`} style={gradientTextStyle}>
              Test Sets
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
                      <span className="text-gray-400">{set.questions.length} questions</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl p-6 bg-[#1c1c1e] text-center">
                  <p className="text-gray-400">
                    {searchQuery
                      ? "No matching test sets found."
                      : "No test sets yet. Create your first set from a note!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab Bar - only show when not viewing a test */}
      {!selectedSet && <TabBar />}
    </div>
  )
}

