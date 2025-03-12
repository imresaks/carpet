import type { BaseEditor } from "slate"
import type { ReactEditor } from "slate-react"

export interface Note {
  id: string
  title: string
  content: string
  lastModified: number
  tags: string[]
  groups?: string[] // Add groups field
}

export interface Group {
  id: string
  name: string
  color?: string
}

export type CustomElement = {
  type: "paragraph" | "heading-one" | "heading-two" | "heading-three" | "bulleted-list" | "numbered-list" | "list-item"
  children: CustomText[]
}

export type CustomText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  highlight?: "yellow" | "red" | "purple" | "green"
}

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

