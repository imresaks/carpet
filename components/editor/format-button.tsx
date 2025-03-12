"use client"

import type React from "react"
import { Editor } from "slate"
import { useSlate } from "slate-react"

interface FormatButtonProps {
  format: string
  icon: React.ReactNode
  color?: "yellow" | "red" | "purple" | "green"
}

export const FormatButton = ({ format, icon, color }: FormatButtonProps) => {
  const editor = useSlate()

  const isBlockActive = (format: string) => {
    const [match] = Editor.nodes(editor, {
      match: (n) => n.type === format,
    })
    return !!match
  }

  const isMarkActive = (format: string, color?: string) => {
    const marks = Editor.marks(editor)
    if (format === "highlight" && color) {
      return marks ? marks[format] === color : false
    }
    return marks ? !!marks[format] : false
  }

  const toggleBlock = (format: string) => {
    const isActive = isBlockActive(format)
    const isList = ["numbered-list", "bulleted-list"].includes(format)

    // Use editor.unwrapNodes instead of Editor.unwrapNodes
    editor.unwrapNodes({
      match: (n) => ["bulleted-list", "numbered-list"].includes(n.type as string),
      split: true,
    })

    // Use editor.setNodes instead of Editor.setNodes
    editor.setNodes({
      type: isActive ? "paragraph" : isList ? "list-item" : format,
    })

    if (!isActive && isList) {
      // Use editor.wrapNodes instead of Editor.wrapNodes
      editor.wrapNodes({ type: format, children: [] })
    }
  }

  // Also fix the toggleMark function to use editor methods directly
  const toggleMark = (format: string, color?: string) => {
    const isActive = isMarkActive(format, color)

    if (isActive) {
      editor.removeMark(format)
    } else {
      if (format === "highlight" && color) {
        editor.addMark(format, color)
      } else {
        editor.addMark(format, true)
      }
    }
  }

  const handleClick = () => {
    if (["heading-one", "heading-two", "heading-three", "bulleted-list", "numbered-list"].includes(format)) {
      toggleBlock(format)
    } else {
      toggleMark(format, color)
    }
  }

  const isActive = ["heading-one", "heading-two", "heading-three", "bulleted-list", "numbered-list"].includes(format)
    ? isBlockActive(format)
    : isMarkActive(format, color)

  return (
    <button
      className={`p-2 rounded-md ${isActive ? "text-purple-500" : "text-white"} hover:bg-gray-800`}
      onMouseDown={(e) => {
        e.preventDefault()
        handleClick()
      }}
    >
      {icon}
    </button>
  )
}

