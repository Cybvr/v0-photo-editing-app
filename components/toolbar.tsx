"use client"

import { Button } from "@/components/ui/button"
import {
  Square,
  Circle,
  Type,
  MousePointer,
  Minus,
  Triangle,
  Star,
  Hexagon,
  Brush,
  ImageIcon,
  Hand,
} from "lucide-react"

interface ToolbarProps {
  tool: string
  onToolChange: (tool: string) => void
}

export function Toolbar({ tool, onToolChange }: ToolbarProps) {
  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "pan", icon: Hand, label: "Pan" }, // Added pan tool
    { id: "brush", icon: Brush, label: "Brush" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "triangle", icon: Triangle, label: "Triangle" },
    { id: "star", icon: Star, label: "Star" },
    { id: "polygon", icon: Hexagon, label: "Polygon" },
    { id: "text", icon: Type, label: "Text" },
    { id: "image", icon: ImageIcon, label: "Image" },
  ]

  return (
    <div className="w-16 bg-card border-r border-border flex flex-col items-center py-4 space-y-2">
      {tools.map(({ id, icon: Icon, label }) => (
        <Button
          key={id}
          variant={tool === id ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange(id)}
          className="w-10 h-10 p-0"
          title={label}
        >
          <Icon className="w-4 h-4" />
        </Button>
      ))}
    </div>
  )
}
