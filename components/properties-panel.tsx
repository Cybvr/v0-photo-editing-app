"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RotateCw, FlipHorizontal, FlipVertical, Trash2 } from "lucide-react"

interface DrawingElement {
  id: string
  type: "brush" | "rectangle" | "circle" | "text" | "line" | "triangle" | "star" | "polygon" | "image"
  x: number
  y: number
  color: string
  strokeWidth: number
  points?: { x: number; y: number }[]
  width?: number
  height?: number
  radius?: number
  endX?: number
  endY?: number
  text?: string
  fontSize?: number
  fontFamily?: string
  textAlign?: "left" | "center" | "right"
  visible?: boolean
  name?: string
  imageData?: string
  imageWidth?: number
  imageHeight?: number
  rotation?: number
  flipX?: boolean
  flipY?: boolean
}

interface PropertiesPanelProps {
  selectedElement: DrawingElement | null
  onUpdateElement: (updates: Partial<DrawingElement>) => void
  onDeleteElement: () => void
}

export function PropertiesPanel({ selectedElement, onUpdateElement, onDeleteElement }: PropertiesPanelProps) {
  if (!selectedElement) {
    return (
      <div className="w-64 bg-card border-l border-border p-4 flex-shrink-0">
        <div className="text-sm text-muted-foreground text-center py-8">Select an object to edit its properties</div>
      </div>
    )
  }

  const handleRotate = () => {
    const currentRotation = selectedElement.rotation || 0
    onUpdateElement({ rotation: (currentRotation + 90) % 360 })
  }

  const handleFlipX = () => {
    onUpdateElement({ flipX: !selectedElement.flipX })
  }

  const handleFlipY = () => {
    onUpdateElement({ flipY: !selectedElement.flipY })
  }

  return (
    <div className="w-64 bg-card border-l border-border p-4 flex-shrink-0 overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm mb-2">Properties</h3>
          <div className="text-xs text-muted-foreground mb-3">
            {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)}
          </div>
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label className="text-xs">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">X</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => onUpdateElement({ x: Number(e.target.value) })}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Y</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => onUpdateElement({ y: Number(e.target.value) })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Size for shapes and images */}
        {(selectedElement.type === "rectangle" ||
          selectedElement.type === "triangle" ||
          selectedElement.type === "image") && (
          <div className="space-y-2">
            <Label className="text-xs">Size</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">W</Label>
                <Input
                  type="number"
                  value={Math.round(selectedElement.width || 0)}
                  onChange={(e) => onUpdateElement({ width: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">H</Label>
                <Input
                  type="number"
                  value={Math.round(selectedElement.height || 0)}
                  onChange={(e) => onUpdateElement({ height: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Radius for circles, stars, polygons */}
        {(selectedElement.type === "circle" ||
          selectedElement.type === "star" ||
          selectedElement.type === "polygon") && (
          <div className="space-y-2">
            <Label className="text-xs">Radius</Label>
            <Input
              type="number"
              value={Math.round(selectedElement.radius || 0)}
              onChange={(e) => onUpdateElement({ radius: Number(e.target.value) })}
              className="h-8 text-xs"
            />
          </div>
        )}

        {/* Color */}
        <div className="space-y-2">
          <Label className="text-xs">Color</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={selectedElement.color}
              onChange={(e) => onUpdateElement({ color: e.target.value })}
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
            <Input
              type="text"
              value={selectedElement.color}
              onChange={(e) => onUpdateElement({ color: e.target.value })}
              className="h-8 text-xs flex-1"
            />
          </div>
        </div>

        {/* Stroke Width for non-text elements */}
        {selectedElement.type !== "text" && selectedElement.type !== "image" && (
          <div className="space-y-2">
            <Label className="text-xs">Stroke Width</Label>
            <Slider
              value={[selectedElement.strokeWidth]}
              onValueChange={([value]) => onUpdateElement({ strokeWidth: value })}
              max={20}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-center">{selectedElement.strokeWidth}px</div>
          </div>
        )}

        {/* Text Properties */}
        {selectedElement.type === "text" && (
          <>
            <div className="space-y-2">
              <Label className="text-xs">Text</Label>
              <Input
                type="text"
                value={selectedElement.text || ""}
                onChange={(e) => onUpdateElement({ text: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Font Size</Label>
              <Slider
                value={[selectedElement.fontSize || 16]}
                onValueChange={([value]) => onUpdateElement({ fontSize: value })}
                max={72}
                min={8}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-center">{selectedElement.fontSize || 16}px</div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Font Family</Label>
              <Select
                value={selectedElement.fontFamily || "Arial"}
                onValueChange={(value) => onUpdateElement({ fontFamily: value })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Text Align</Label>
              <Select
                value={selectedElement.textAlign || "left"}
                onValueChange={(value: "left" | "center" | "right") => onUpdateElement({ textAlign: value })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Transform Controls */}
        <div className="space-y-2">
          <Label className="text-xs">Transform</Label>
          <div className="grid grid-cols-3 gap-1">
            <Button variant="outline" size="sm" onClick={handleRotate} className="h-8 p-1 bg-transparent">
              <RotateCw className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleFlipX} className="h-8 p-1 bg-transparent">
              <FlipHorizontal className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleFlipY} className="h-8 p-1 bg-transparent">
              <FlipVertical className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Delete Button */}
        <div className="pt-4 border-t border-border">
          <Button variant="destructive" size="sm" onClick={onDeleteElement} className="w-full h-8">
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
