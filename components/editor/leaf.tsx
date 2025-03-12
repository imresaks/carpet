import type { RenderLeafProps } from "slate-react"

export const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  let formattedChildren = children

  if (leaf.bold) {
    formattedChildren = <strong>{formattedChildren}</strong>
  }

  if (leaf.italic) {
    formattedChildren = <em>{formattedChildren}</em>
  }

  if (leaf.underline) {
    formattedChildren = <u>{formattedChildren}</u>
  }

  if (leaf.strikethrough) {
    formattedChildren = <s>{formattedChildren}</s>
  }

  if (leaf.highlight) {
    const highlightColors = {
      yellow: "bg-yellow-200 text-black",
      red: "bg-red-200 text-red-900",
      purple: "bg-purple-200 text-purple-900",
      green: "bg-green-200 text-green-900",
    }

    const colorClass = highlightColors[leaf.highlight as keyof typeof highlightColors]

    formattedChildren = <span className={`px-1 rounded ${colorClass}`}>{formattedChildren}</span>
  }

  return <span {...attributes}>{formattedChildren}</span>
}

