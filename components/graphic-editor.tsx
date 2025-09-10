"use client"

import type React from "react"
import { PropertiesPanel } from "./properties-panel"
import { useState, useRef, useCallback } from "react"
import { Toolbar } from "./toolbar"
import { TopToolbar } from "./top-toolbar"
import { DrawingCanvas } from "./drawing-canvas"

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
}

interface CanvasState {
  elements: DrawingElement[]
  selectedElementId: string | null
}

export function GraphicEditor() {
  const [tool, setTool] = useState<string>("select")
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentColor, setCurrentColor] = useState("#164e63")
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [fillMode, setFillMode] = useState(true)
  const [fontSize, setFontSize] = useState(16)
  const [canvasState, setCanvasState] = useState<CanvasState>({
    elements: [],
    selectedElementId: null,
  })
  const [history, setHistory] = useState<CanvasState[]>([{ elements: [], selectedElementId: null }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [isEditingText, setIsEditingText] = useState(false)
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 })
  const [textInputValue, setTextInputValue] = useState("")
  const [fontFamily, setFontFamily] = useState("Arial")
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragElementStart, setDragElementStart] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)

  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ ...canvasState })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex, canvasState])

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setCanvasState(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setCanvasState(history[historyIndex + 1])
    }
  }

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.1))
  }

  const handleZoomReset = () => {
    setZoom(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left - panOffset.x) / zoom,
      y: (e.clientY - rect.top - panOffset.y) / zoom,
    }
  }

  const addElement = (pos: { x: number; y: number }) => {
    const newElement: DrawingElement = {
      id: generateId(),
      type: tool as any,
      x: pos.x,
      y: pos.y,
      color: currentColor,
      strokeWidth,
      visible: true,
    }

    if (tool === "brush") {
      newElement.points = [pos]
    } else if (tool === "rectangle" || tool === "triangle") {
      newElement.width = 0
      newElement.height = 0
    } else if (tool === "circle" || tool === "star" || tool === "polygon") {
      newElement.radius = 0
    } else if (tool === "line") {
      newElement.endX = pos.x
      newElement.endY = pos.y
    }

    setCanvasState((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedElementId: newElement.id,
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return

    processImageFile(file)

    // Reset input
    e.target.value = ""
  }

  const processImageFile = (file: File, dropPosition?: { x: number; y: number }) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Scale image to fit canvas if too large
        const maxWidth = canvas.width * 0.5
        const maxHeight = canvas.height * 0.5
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        // Use drop position if available, otherwise center the image
        const x = dropPosition ? dropPosition.x - width / 2 : (canvas.width - width) / 2
        const y = dropPosition ? dropPosition.y - height / 2 : (canvas.height - height) / 2

        const newElement: DrawingElement = {
          id: generateId(),
          type: "image",
          x,
          y,
          color: currentColor,
          strokeWidth,
          imageData: event.target?.result as string,
          imageWidth: width,
          imageHeight: height,
          width,
          height,
          visible: true,
        }

        setCanvasState((prev) => ({
          ...prev,
          elements: [...prev.elements, newElement],
          selectedElementId: newElement.id,
        }))
        saveToHistory()
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const findElementAtPosition = (pos: { x: number; y: number }) => {
    // Check elements in reverse order (top to bottom)
    for (let i = canvasState.elements.length - 1; i >= 0; i--) {
      const element = canvasState.elements[i]
      if (!element.visible) continue

      if (element.type === "rectangle" || element.type === "triangle") {
        const width = element.width || 0
        const height = element.height || 0
        const minX = width >= 0 ? element.x : element.x + width
        const maxX = width >= 0 ? element.x + width : element.x
        const minY = height >= 0 ? element.y : element.y + height
        const maxY = height >= 0 ? element.y + height : element.y

        if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
          return element.id
        }
      } else if (element.type === "circle") {
        const distance = Math.sqrt(Math.pow(pos.x - element.x, 2) + Math.pow(pos.y - element.y, 2))
        if (distance <= (element.radius || 0)) {
          return element.id
        }
      } else if (element.type === "star" || element.type === "polygon") {
        const distance = Math.sqrt(Math.pow(pos.x - element.x, 2) + Math.pow(pos.y - element.y, 2))
        if (distance <= (element.radius || 0)) {
          return element.id
        }
      } else if (element.type === "line") {
        const x1 = element.x
        const y1 = element.y
        const x2 = element.endX || element.x
        const y2 = element.endY || element.y

        const A = pos.x - x1
        const B = pos.y - y1
        const C = x2 - x1
        const D = y2 - y1

        const dot = A * C + B * D
        const lenSq = C * C + D * D

        if (lenSq === 0) continue

        const param = dot / lenSq
        let xx, yy

        if (param < 0) {
          xx = x1
          yy = y1
        } else if (param > 1) {
          xx = x2
          yy = y2
        } else {
          xx = x1 + param * C
          yy = y1 + param * D
        }

        const dx = pos.x - xx
        const dy = pos.y - yy
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance <= Math.max(element.strokeWidth / 2, 8)) {
          return element.id
        }
      } else if (element.type === "text" && element.text) {
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.font = `${element.fontSize || 16}px ${element.fontFamily || "Arial"}`
            const metrics = ctx.measureText(element.text)
            const textWidth = metrics.width
            const textHeight = element.fontSize || 16

            if (
              pos.x >= element.x &&
              pos.x <= element.x + textWidth &&
              pos.y >= element.y - textHeight &&
              pos.y <= element.y + 4
            ) {
              return element.id
            }
          }
        }
      } else if (element.type === "image") {
        const width = element.width || element.imageWidth || 0
        const height = element.height || element.imageHeight || 0
        if (pos.x >= element.x && pos.x <= element.x + width && pos.y >= element.y && pos.y <= element.y + height) {
          return element.id
        }
      } else if (element.type === "brush" && element.points) {
        for (const point of element.points) {
          const distance = Math.sqrt(Math.pow(pos.x - point.x, 2) + Math.pow(pos.y - point.y, 2))
          if (distance <= Math.max(element.strokeWidth, 8)) {
            return element.id
          }
        }
      }
    }
    return null
  }

  const completeTextInput = () => {
    if (textInputValue.trim()) {
      const newElement: DrawingElement = {
        id: generateId(),
        type: "text",
        x: textInputPosition.x,
        y: textInputPosition.y,
        color: currentColor,
        strokeWidth,
        text: textInputValue,
        fontSize,
        fontFamily,
        textAlign,
        visible: true,
      }

      setCanvasState((prev) => ({
        ...prev,
        elements: [...prev.elements, newElement],
        selectedElementId: newElement.id,
      }))
      saveToHistory()
    }

    setIsEditingText(false)
    setTextInputValue("")
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isEditingText) {
      completeTextInput()
      return
    }

    if (e.button === 1 || (e.button === 0 && (e.ctrlKey || tool === "pan"))) {
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      return
    }

    const pos = getMousePos(e)
    setIsDrawing(true)

    if (tool === "image") {
      fileInputRef.current?.click()
      return
    }

    if (tool === "select") {
      const elementId = findElementAtPosition(pos)
      setCanvasState((prev) => ({
        ...prev,
        selectedElementId: elementId,
      }))

      if (elementId) {
        const element = canvasState.elements.find((el) => el.id === elementId)
        if (element) {
          setIsDragging(true)
          setDragStart(pos)
          setDragElementStart({ x: element.x, y: element.y })
        }
      }
      return
    }

    if (tool === "text") {
      setIsEditingText(true)
      setTextInputPosition(pos)
      setTextInputValue("")
      setTimeout(() => textInputRef.current?.focus(), 0)
      return
    }

    addElement(pos)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }))
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      return
    }

    if (isDragging && canvasState.selectedElementId) {
      const pos = getMousePos(e)
      const deltaX = pos.x - dragStart.x
      const deltaY = pos.y - dragStart.y

      setCanvasState((prev) => ({
        ...prev,
        elements: prev.elements.map((element) => {
          if (element.id === prev.selectedElementId) {
            if (element.type === "line") {
              return {
                ...element,
                x: dragElementStart.x + deltaX,
                y: dragElementStart.y + deltaY,
                endX: (element.endX || element.x) + deltaX,
                endY: (element.endY || element.y) + deltaY,
              }
            } else {
              return {
                ...element,
                x: dragElementStart.x + deltaX,
                y: dragElementStart.y + deltaY,
              }
            }
          }
          return element
        }),
      }))
      return
    }

    if (!isDrawing) return

    const pos = getMousePos(e)

    setCanvasState((prev) => {
      const elements = [...prev.elements]
      const currentElement = elements[elements.length - 1]

      if (!currentElement) return prev

      if (tool === "brush" && currentElement.points) {
        currentElement.points.push(pos)
      } else if (tool === "rectangle" || tool === "triangle") {
        currentElement.width = pos.x - currentElement.x
        currentElement.height = pos.y - currentElement.y
      } else if (tool === "circle" || tool === "star" || tool === "polygon") {
        const distance = Math.sqrt(Math.pow(pos.x - currentElement.x, 2) + Math.pow(pos.y - currentElement.y, 2))
        currentElement.radius = distance
      } else if (tool === "line") {
        currentElement.endX = pos.x
        currentElement.endY = pos.y
      }

      return { ...prev, elements }
    })
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    if (isDragging) {
      setIsDragging(false)
      saveToHistory()
    }
    if (isDrawing) {
      saveToHistory()
    }
    setIsDrawing(false)
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom((prev) => Math.min(Math.max(prev * delta, 0.1), 5))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const dropPosition = {
      x: (e.clientX - rect.left - panOffset.x) / zoom,
      y: (e.clientY - rect.top - panOffset.y) / zoom,
    }

    processImageFile(imageFiles[0], dropPosition)
  }

  const updateSelectedElement = (updates: Partial<DrawingElement>) => {
    if (!canvasState.selectedElementId) return

    setCanvasState((prev) => ({
      ...prev,
      elements: prev.elements.map((element) =>
        element.id === prev.selectedElementId ? { ...element, ...updates } : element,
      ),
    }))
    saveToHistory()
  }

  const deleteSelectedElement = () => {
    if (!canvasState.selectedElementId) return

    setCanvasState((prev) => ({
      ...prev,
      elements: prev.elements.filter((element) => element.id !== prev.selectedElementId),
      selectedElementId: null,
    }))
    saveToHistory()
  }

  const selectedElement = canvasState.elements.find((el) => el.id === canvasState.selectedElementId) || null

  return (
    <div
      className="flex h-screen bg-background text-foreground overflow-hidden"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

      {isEditingText && (
        <input
          ref={textInputRef}
          type="text"
          value={textInputValue}
          onChange={(e) => setTextInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              completeTextInput()
            } else if (e.key === "Escape") {
              setIsEditingText(false)
              setTextInputValue("")
            }
          }}
          onBlur={completeTextInput}
          className="absolute z-50 bg-transparent border-none outline-none text-foreground"
          style={{
            left: textInputPosition.x * zoom + panOffset.x,
            top: textInputPosition.y * zoom + panOffset.y,
            fontSize: fontSize * zoom,
            fontFamily,
            color: currentColor,
            textAlign,
          }}
        />
      )}

      <div className="flex-shrink-0 w-16 md:w-20">
        <Toolbar tool={tool} onToolChange={setTool} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-shrink-0">
          <TopToolbar
            tool={tool}
            zoom={zoom}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onUndo={undo}
            onRedo={redo}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            fillMode={fillMode}
            onFillModeChange={setFillMode}
          />
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1">
            <DrawingCanvas
              ref={canvasRef}
              canvasState={canvasState}
              fillMode={fillMode}
              panOffset={panOffset}
              zoom={zoom}
              isPanning={isPanning}
              tool={tool}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
            />
          </div>

          <PropertiesPanel
            selectedElement={selectedElement}
            onUpdateElement={updateSelectedElement}
            onDeleteElement={deleteSelectedElement}
          />
        </div>
      </div>
    </div>
  )
}
