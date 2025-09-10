"use client"

import { Button } from "@/components/ui/button"
import { Undo, Redo, ZoomIn, ZoomOut, RotateCcw, Square, Circle } from "lucide-react"

interface TopToolbarProps {
  tool: string
  zoom: number
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  fillMode: boolean
  onFillModeChange: (fillMode: boolean) => void
}

export function TopToolbar({
  tool,
  zoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  fillMode,
  onFillModeChange,
}: TopToolbarProps) {
  return (
    <div className="h-14 bg-card border-b border-border px-4 flex items-center justify-between">
      <h2 className="text-sm font-medium">
        {tool === "select" ? "Select Tool" : `${tool.charAt(0).toUpperCase() + tool.slice(1)} Tool`}
      </h2>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
          <Undo className="w-4 h-4 mr-1" />
          Undo
        </Button>
        <Button variant="outline" size="sm" onClick={onRedo} disabled={!canRedo}>
          <Redo className="w-4 h-4 mr-1" />
          Redo
        </Button>

        <div className="flex items-center gap-1 ml-4">
          <Button
            variant={fillMode ? "default" : "outline"}
            size="sm"
            onClick={() => onFillModeChange(true)}
            title="Fill shapes"
          >
            <Square className="w-4 h-4" fill="currentColor" />
          </Button>
          <Button
            variant={!fillMode ? "default" : "outline"}
            size="sm"
            onClick={() => onFillModeChange(false)}
            title="Stroke only"
          >
            <Circle className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 ml-4">
          <Button variant="outline" size="sm" onClick={onZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={onZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onZoomReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
