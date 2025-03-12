import type { RenderElementProps } from "slate-react"

export const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case "heading-one":
      return (
        <h1 className="text-3xl font-bold my-3" {...attributes}>
          {children}
        </h1>
      )
    case "heading-two":
      return (
        <h2 className="text-2xl font-bold my-2" {...attributes}>
          {children}
        </h2>
      )
    case "heading-three":
      return (
        <h3 className="text-xl font-bold my-2" {...attributes}>
          {children}
        </h3>
      )
    case "bulleted-list":
      return (
        <ul className="list-disc pl-5 my-2" {...attributes}>
          {children}
        </ul>
      )
    case "numbered-list":
      return (
        <ol className="list-decimal pl-5 my-2" {...attributes}>
          {children}
        </ol>
      )
    case "list-item":
      return <li {...attributes}>{children}</li>
    default:
      return (
        <p className="my-2" {...attributes}>
          {children}
        </p>
      )
  }
}

