"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createEditor, type Descendant } from "slate"
import { Slate, Editable, withReact } from "slate-react"
import { ArrowLeft, Save, Book, Square, Loader2, ChevronDown, ClipboardCheck, Tag, Plus } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { loadNotes, saveNote, deleteNote } from "@/lib/notes"
import { loadGroups, addGroup } from "@/lib/groups"
import { generateFlashCards } from "@/lib/flash-cards"
import { generateTestQuestions } from "@/lib/tests"
import type { Note, Group } from "@/types/note"
import { v4 as uuidv4 } from "uuid"
import { loadSettings } from "@/lib/settings"
import { EditorToolbar } from "@/components/editor/editor-toolbar"
import { Element } from "@/components/editor/element"
import { Leaf } from "@/components/editor/leaf"

// Default empty slate value - always use this as a fallback
const emptyValue: Descendant[] = [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
]

// Convert string to Slate format (improved version)
const stringToSlate = (content: string | null | undefined): Descendant[] => {
  // If content is null, undefined, or empty string, return empty value
  if (!content) {
    return emptyValue
  }

  try {
    const parsed = JSON.parse(content)
    // Validate that the parsed content is an array
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Validate that each item has a type and children
      const isValid = parsed.every(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          "type" in item &&
          "children" in item &&
          Array.isArray(item.children),
      )

      if (isValid) {
        return parsed
      }
    }
    // If validation fails, return a paragraph with the content as text
    return [
      {
        type: "paragraph",
        children: [{ text: typeof content === "string" ? content : "" }],
      },
    ]
  } catch (e) {
    // If parsing fails, return a paragraph with the content as text
    return [
      {
        type: "paragraph",
        children: [{ text: typeof content === "string" ? content : "" }],
      },
    ]
  }
}

// Convert Slate format to string for storage
const slateToString = (value: Descendant[]): string => {
  return JSON.stringify(value)
}

export default function NotePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [note, setNote] = useState<Note>({
    id: params.id === "new" ? uuidv4() : params.id,
    title: "",
    content: "",
    lastModified: Date.now(),
    tags: [],
    groups: [],
  })

  // Add state for the dialog
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [settings, setSettings] = useState({ color1: "#ffffff", color2: "#ffffff", useBW: false })
  const [showHighlightOptions, setShowHighlightOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showOptionsDialog, setShowOptionsDialog] = useState(false)
  const [showGroupsDialog, setShowGroupsDialog] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [newGroupName, setNewGroupName] = useState("")

  // Flash card states
  const [flashCardCount, setFlashCardCount] = useState(10)
  const [flashCardDifficulty, setFlashCardDifficulty] = useState(1) // 0: Easy, 1: Medium, 2: Hard
  const [isGeneratingFlashCards, setIsGeneratingFlashCards] = useState(false)
  const [flashCardError, setFlashCardError] = useState<string | null>(null)
  const [showFlashCardOptions, setShowFlashCardOptions] = useState(false)

  // Test states
  const [testQuestionCount, setTestQuestionCount] = useState(10)
  const [testDifficulty, setTestDifficulty] = useState(1) // 0: Easy, 1: Medium, 2: Hard
  const [isGeneratingTest, setIsGeneratingTest] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [showTestOptions, setShowTestOptions] = useState(false)

  // Create a Slate editor object that won't change across renders
  const editor = useMemo(() => withReact(createEditor()), [])

  // Initialize with empty content - ALWAYS use emptyValue as initial state
  const [value, setValue] = useState<Descendant[]>(emptyValue)

  // Load existing note if editing
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)

      try {
        // Load settings
        const savedSettings = loadSettings()
        setSettings(savedSettings)

        // Load groups
        const savedGroups = loadGroups()
        setGroups(savedGroups)

        // Load note if editing an existing one
        if (params.id !== "new") {
          const notes = loadNotes()
          const existingNote = notes.find((n) => n.id === params.id)
          if (existingNote) {
            setNote(existingNote)
            // Set selected groups
            setSelectedGroups(existingNote.groups || [])
            // Convert content to Slate format with fallback to empty value
            const slateValue = stringToSlate(existingNote.content)
            setValue(slateValue)
          }
        }
      } catch (error) {
        console.error("Error loading note:", error)
        // Ensure we still have a valid value even if loading fails
        setValue(emptyValue)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [params.id])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasChanges(true)
    setNote((prev) => ({
      ...prev,
      title: e.target.value,
    }))
  }

  const handleEditorChange = (newValue: Descendant[]) => {
    // Ensure we never set undefined as the value
    if (!newValue || !Array.isArray(newValue) || newValue.length === 0) {
      setValue(emptyValue)
      return
    }

    setValue(newValue)
    setHasChanges(true)
    setNote((prev) => ({
      ...prev,
      content: slateToString(newValue),
    }))
  }

  const handleSave = useCallback(() => {
    const noteToSave = {
      ...note,
      title: note.title.trim() || "(No title)",
      content: slateToString(value || emptyValue), // Ensure we never save undefined
      lastModified: Date.now(),
      groups: selectedGroups, // Save selected groups
    }
    saveNote(noteToSave)
    setHasChanges(false)
    router.push("/notes")
  }, [note, value, router, selectedGroups])

  // Update the handleBack function to skip the dialog when no changes were made
  const handleBack = () => {
    if (hasChanges) {
      setShowExitDialog(true)
    } else {
      router.push("/notes")
    }
  }

  const handleDiscard = () => {
    if (params.id === "new") {
      deleteNote(note.id)
    }
    router.push("/notes")
  }

  const toggleFlashCardOptions = () => {
    setShowFlashCardOptions(!showFlashCardOptions)
  }

  const toggleTestOptions = () => {
    setShowTestOptions(!showTestOptions)
  }

  const handleGroupCheckboxChange = (groupId: string) => {
    setSelectedGroups((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId)
      } else {
        return [...prev, groupId]
      }
    })
    setHasChanges(true)
  }

  const handleCreateNewGroup = () => {
    if (newGroupName.trim()) {
      const newGroup = addGroup(newGroupName.trim())
      setGroups((prev) => [...prev, newGroup])
      setSelectedGroups((prev) => [...prev, newGroup.id])
      setNewGroupName("")
      setHasChanges(true)
    }
  }

  const handleCreateFlashCards = async () => {
    setIsGeneratingFlashCards(true)
    setFlashCardError(null)

    try {
      // Save the note first if it has changes
      let currentNote = note
      if (hasChanges) {
        currentNote = {
          ...note,
          title: note.title.trim() || "(No title)",
          content: slateToString(value || emptyValue),
          lastModified: Date.now(),
          groups: selectedGroups,
        }
        saveNote(currentNote)
        setHasChanges(false)
      }

      console.log("Creating flash cards from note:", currentNote.title)

      // Generate flash cards
      const flashCardSet = await generateFlashCards(
        currentNote.content,
        currentNote.title,
        currentNote.id,
        flashCardCount,
        flashCardDifficulty,
      )

      if (flashCardSet) {
        console.log("Flash cards created successfully:", flashCardSet.title, "with", flashCardSet.cards.length, "cards")
        // Close the dialog and navigate to flash cards
        setShowOptionsDialog(false)
        router.push("/flash-cards")
      } else {
        throw new Error("Failed to create flash card set")
      }
    } catch (error) {
      console.error("Error creating flash cards:", error)
      setFlashCardError("Failed to generate flash cards. Please try again.")
    } finally {
      setIsGeneratingFlashCards(false)
    }
  }

  const handleCreateTest = async () => {
    setIsGeneratingTest(true)
    setTestError(null)

    try {
      // Save the note first if it has changes
      let currentNote = note
      if (hasChanges) {
        currentNote = {
          ...note,
          title: note.title.trim() || "(No title)",
          content: slateToString(value || emptyValue),
          lastModified: Date.now(),
          groups: selectedGroups,
        }
        saveNote(currentNote)
        setHasChanges(false)
      }

      console.log("Creating test questions from note:", currentNote.title)

      // Generate test questions
      const testSet = await generateTestQuestions(
        currentNote.content,
        currentNote.title,
        currentNote.id,
        testQuestionCount,
        testDifficulty,
      )

      if (testSet) {
        console.log(
          "Test questions created successfully:",
          testSet.title,
          "with",
          testSet.questions.length,
          "questions",
        )
        // Close the dialog and navigate to tests
        setShowOptionsDialog(false)
        router.push("/tests")
      } else {
        throw new Error("Failed to create test set")
      }
    } catch (error) {
      console.error("Error creating test questions:", error)
      setTestError("Failed to generate test questions. Please try again.")
    } finally {
      setIsGeneratingTest(false)
    }
  }

  // Generate gradient text style
  const gradientTextStyle = {
    backgroundImage: settings.useBW ? "none" : `linear-gradient(to right, ${settings.color1}, ${settings.color2})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: settings.useBW ? "white" : "transparent",
    color: settings.useBW ? "white" : "transparent",
  }

  // Close highlight options when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowHighlightOptions(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Ensure we have a valid value for Slate
  const editorValue = useMemo(() => {
    return Array.isArray(value) && value.length > 0 ? value : emptyValue
  }, [value])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-black z-10">
        <button onClick={handleBack} className="p-2">
          <ArrowLeft className="w-6 h-6" style={{ color: settings.useBW ? "white" : settings.color1 }} />
        </button>

        <input
          type="text"
          placeholder="name of note"
          value={note.title}
          onChange={handleTitleChange}
          className="flex-1 bg-transparent text-center text-lg focus:outline-none mx-4 truncate"
        />

        <div className="flex items-center gap-2">
          <button onClick={() => setShowGroupsDialog(true)} className="p-2">
            <Tag className="w-6 h-6" style={{ color: settings.useBW ? "white" : settings.color1 }} />
          </button>
          <button onClick={() => setShowOptionsDialog(true)} className="p-2">
            <Book className="w-6 h-6" style={{ color: settings.useBW ? "white" : settings.color2 }} />
          </button>
          <button onClick={handleSave} className="p-2">
            <Save className="w-6 h-6" style={{ color: settings.useBW ? "white" : settings.color2 }} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="prose prose-invert max-w-none">
          {/* Only render Slate when we have a valid value */}
          <Slate editor={editor} initialValue={editorValue} onChange={handleEditorChange}>
            <div className="min-h-[calc(100vh-300px)] focus:outline-none">
              <Editable
                className="min-h-full focus:outline-none"
                renderElement={(props) => <Element {...props} />}
                renderLeaf={(props) => <Leaf {...props} />}
                placeholder="Start typing..."
                spellCheck
                autoFocus
              />
            </div>

            {/* Formatting Toolbar */}
            <div className="fixed bottom-0 left-0 right-0">
              <EditorToolbar
                showHighlightOptions={showHighlightOptions}
                setShowHighlightOptions={setShowHighlightOptions}
              />
            </div>
          </Slate>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-[#1c1c1e] border border-gray-800 rounded-xl max-w-[90%] w-full mx-auto animate-in fade-in-50 zoom-in-95 duration-200">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-xl font-bold text-white">Save changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-400">
              Do you want to save the changes to this note?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col space-y-3 pt-4">
            <AlertDialogAction
              className={`w-full py-3 rounded-xl transition-all duration-200 hover:scale-[0.98] active:scale-[0.96]`}
              style={
                settings.useBW
                  ? { backgroundColor: "white", color: "black" }
                  : {
                      background: `linear-gradient(to right, ${settings.color1}, ${settings.color2})`,
                      color: "white",
                    }
              }
              onClick={handleSave}
            >
              Save
            </AlertDialogAction>
            <AlertDialogCancel
              className="w-full py-3 rounded-xl bg-[#2c2c2e] text-white border border-gray-700 transition-all duration-200 hover:scale-[0.98] active:scale-[0.96]"
              onClick={handleDiscard}
            >
              Don't Save
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Groups Dialog */}
      <Dialog open={showGroupsDialog} onOpenChange={setShowGroupsDialog}>
        <DialogContent className="bg-[#1c1c1e] border-gray-800 rounded-xl max-w-md w-full mx-auto">
          <DialogHeader className="space-y-2 pb-2">
            <DialogTitle className="text-2xl font-bold text-white">Assign to Groups</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm font-normal">
              Select groups for this note or create a new one
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Group checkboxes */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center space-x-3 p-3 rounded-xl hover:bg-[#2c2c2e] cursor-pointer"
                  onClick={() => handleGroupCheckboxChange(group.id)}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors duration-200 ${
                      selectedGroups.includes(group.id) ? "bg-white" : "border border-gray-500"
                    }`}
                  >
                    {selectedGroups.includes(group.id) && (
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
                  <span className="text-white">{group.name}</span>
                </div>
              ))}
            </div>

            {/* Create new group */}
            <div className="pt-3 border-t border-gray-800">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="New group name"
                  className="flex-1 bg-[#2c2c2e] text-white rounded-xl py-3 px-4 focus:outline-none"
                />
                <button
                  onClick={handleCreateNewGroup}
                  disabled={!newGroupName.trim()}
                  className={`p-3 rounded-xl ${
                    newGroupName.trim() ? "bg-white text-black hover:bg-gray-200" : "bg-gray-700 text-gray-400"
                  } transition-colors duration-200`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setShowGroupsDialog(false)}
              className="w-full py-3 rounded-full transition-all duration-200 hover:scale-[0.98] active:scale-[0.96]"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Options Dialog */}
      <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
        <DialogContent className="bg-[#1c1c1e] border-gray-800 rounded-xl max-w-md w-full mx-auto">
          <DialogHeader className="space-y-2 pb-2">
            <DialogTitle className="text-2xl font-bold text-white">Create Learning Materials</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm font-normal">
              What would you like to create from this note?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-6 py-4">
            <div className="space-y-6">
              {/* Make Test Section */}
              <div className="space-y-4">
                <div
                  className="w-full py-4 flex items-center justify-between px-6 bg-[#2c2c2e] rounded-2xl cursor-pointer transition-all duration-300 hover:bg-[#3c3c3e]"
                  onClick={toggleTestOptions}
                >
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5" />
                      <span className="font-medium">Make Test</span>
                    </div>
                  </div>
                  <div
                    className="transition-transform duration-300"
                    style={{ transform: showTestOptions ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {showTestOptions && (
                  <div className="space-y-6 p-5 border border-gray-800 rounded-2xl bg-[#2c2c2e] transition-all duration-300 animate-in fade-in-50 slide-in-from-top-5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-400">Number of questions</label>
                        <span className="text-sm text-gray-300">{testQuestionCount}</span>
                      </div>
                      <Slider
                        value={[testQuestionCount]}
                        min={1}
                        max={100}
                        step={1}
                        onValueChange={(value) => setTestQuestionCount(value[0])}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-400">Difficulty level</label>
                        <span className="text-sm text-gray-300">
                          {testDifficulty === 0 ? "Easy" : testDifficulty === 1 ? "Medium" : "Hard"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          className={`py-3 px-4 rounded-full text-sm transition-all duration-200 ${
                            testDifficulty === 0
                              ? "bg-green-800/40 text-green-300 border border-green-700/50"
                              : "bg-[#3c3c3e] text-gray-400 hover:bg-[#4c4c4e]"
                          }`}
                          onClick={() => setTestDifficulty(0)}
                        >
                          Easy
                        </button>
                        <button
                          className={`py-3 px-4 rounded-full text-sm transition-all duration-200 ${
                            testDifficulty === 1
                              ? "bg-yellow-800/30 text-yellow-300 border border-yellow-700/50"
                              : "bg-[#3c3c3e] text-gray-400 hover:bg-[#4c4c4e]"
                          }`}
                          onClick={() => setTestDifficulty(1)}
                        >
                          Medium
                        </button>
                        <button
                          className={`py-3 px-4 rounded-full text-sm transition-all duration-200 ${
                            testDifficulty === 2
                              ? "bg-red-900/30 text-red-300 border border-red-800/50"
                              : "bg-[#3c3c3e] text-gray-400 hover:bg-[#4c4c4e]"
                          }`}
                          onClick={() => setTestDifficulty(2)}
                        >
                          Hard
                        </button>
                      </div>
                    </div>

                    {testError && (
                      <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded-xl border border-red-800/30 animate-in fade-in-50">
                        {testError}
                      </div>
                    )}

                    <Button
                      className="w-full py-3 rounded-full transition-all duration-200 hover:scale-[0.98] active:scale-[0.96]"
                      onClick={handleCreateTest}
                      disabled={isGeneratingTest}
                    >
                      {isGeneratingTest ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Create Test"
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Make Flash Cards Section */}
              <div className="space-y-4">
                <div
                  className="w-full py-4 flex items-center justify-between px-6 bg-[#2c2c2e] rounded-2xl cursor-pointer transition-all duration-300 hover:bg-[#3c3c3e]"
                  onClick={toggleFlashCardOptions}
                >
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <Square className="w-5 h-5" />
                      <span className="font-medium">Make Flash Cards</span>
                    </div>
                  </div>
                  <div
                    className="transition-transform duration-300"
                    style={{ transform: showFlashCardOptions ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {showFlashCardOptions && (
                  <div className="space-y-6 p-5 border border-gray-800 rounded-2xl bg-[#2c2c2e] transition-all duration-300 animate-in fade-in-50 slide-in-from-top-5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-400">Number of cards</label>
                        <span className="text-sm text-gray-300">{flashCardCount}</span>
                      </div>
                      <Slider
                        value={[flashCardCount]}
                        min={1}
                        max={50}
                        step={1}
                        onValueChange={(value) => setFlashCardCount(value[0])}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-400">Difficulty level</label>
                        <span className="text-sm text-gray-300">
                          {flashCardDifficulty === 0 ? "Easy" : flashCardDifficulty === 1 ? "Medium" : "Hard"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          className={`py-3 px-4 rounded-full text-sm transition-all duration-200 ${
                            flashCardDifficulty === 0
                              ? "bg-green-800/40 text-green-300 border border-green-700/50"
                              : "bg-[#3c3c3e] text-gray-400 hover:bg-[#4c4c4e]"
                          }`}
                          onClick={() => setFlashCardDifficulty(0)}
                        >
                          Easy
                        </button>
                        <button
                          className={`py-3 px-4 rounded-full text-sm transition-all duration-200 ${
                            flashCardDifficulty === 1
                              ? "bg-yellow-800/30 text-yellow-300 border border-yellow-700/50"
                              : "bg-[#3c3c3e] text-gray-400 hover:bg-[#4c4c4e]"
                          }`}
                          onClick={() => setFlashCardDifficulty(1)}
                        >
                          Medium
                        </button>
                        <button
                          className={`py-3 px-4 rounded-full text-sm transition-all duration-200 ${
                            flashCardDifficulty === 2
                              ? "bg-red-900/30 text-red-300 border border-red-800/50"
                              : "bg-[#3c3c3e] text-gray-400 hover:bg-[#4c4c4e]"
                          }`}
                          onClick={() => setFlashCardDifficulty(2)}
                        >
                          Hard
                        </button>
                      </div>
                    </div>

                    {flashCardError && (
                      <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded-xl border border-red-800/30 animate-in fade-in-50">
                        {flashCardError}
                      </div>
                    )}

                    <Button
                      className="w-full py-3 rounded-full transition-all duration-200 hover:scale-[0.98] active:scale-[0.96]"
                      onClick={handleCreateFlashCards}
                      disabled={isGeneratingFlashCards}
                    >
                      {isGeneratingFlashCards ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Create Flash Cards"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

