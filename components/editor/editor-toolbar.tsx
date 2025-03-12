"use client"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  ChevronDown,
} from "lucide-react"
import { FormatButton } from "./format-button"

interface EditorToolbarProps {
  showHighlightOptions: boolean
  setShowHighlightOptions: (show: boolean) => void
}

export const EditorToolbar = ({ showHighlightOptions, setShowHighlightOptions }: EditorToolbarProps) => {
  return (
    <div className="flex items-center justify-between p-2 bg-[#1c1c1e] border-t border-gray-800 overflow-x-auto">
      <div className="flex items-center space-x-1">
        <FormatButton format="bold" icon={<Bold size={18} />} />
        <FormatButton format="italic" icon={<Italic size={18} />} />
        <FormatButton format="underline" icon={<Underline size={18} />} />
        <FormatButton format="strikethrough" icon={<Strikethrough size={18} />} />
        <FormatButton format="heading-one" icon={<Heading1 size={18} />} />
        <FormatButton format="heading-two" icon={<Heading2 size={18} />} />
        <FormatButton format="bulleted-list" icon={<List size={18} />} />
        <FormatButton format="numbered-list" icon={<ListOrdered size={18} />} />

        <div className="relative">
          <button
            className="p-2 rounded-md text-white hover:bg-gray-800 flex items-center"
            onClick={() => setShowHighlightOptions(!showHighlightOptions)}
          >
            <span className="mr-1">H</span>
            <ChevronDown size={14} />
          </button>

          {showHighlightOptions && (
            <div className="absolute bottom-full left-0 mb-2 bg-[#2c2c2e] rounded-md shadow-lg p-2 flex flex-col space-y-2">
              <FormatButton
                format="highlight"
                icon={
                  <div className="w-6 h-6 rounded-full bg-yellow-300 flex items-center justify-center text-black font-bold">
                    H
                  </div>
                }
                color="yellow"
              />
              <FormatButton
                format="highlight"
                icon={
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                    H
                  </div>
                }
                color="red"
              />
              <FormatButton
                format="highlight"
                icon={
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                    H
                  </div>
                }
                color="purple"
              />
              <FormatButton
                format="highlight"
                icon={
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                    H
                  </div>
                }
                color="green"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

