"use client"

import type React from "react"

import { useEffect, useCallback, forwardRef, useState } from "react"

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

interface DrawingCanvasProps {
  canvasState: CanvasState
  fillMode: boolean
  panOffset: { x: number; y: number }
  zoom: number
  isPanning: boolean
  tool: string
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void
}

export const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>(
  ({ canvasState, fillMode, panOffset, zoom, isPanning, tool, onMouseDown, onMouseMove, onMouseUp, onWheel }, ref) => {
    const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 })

    useEffect(() => {
      const updateCanvasSize = () => {
        const isMobile = window.innerWidth < 768
        const isTablet = window.innerWidth < 1024

        if (isMobile) {
          setCanvasSize({ width: 800, height: 600 })
        } else if (isTablet) {
          setCanvasSize({ width: 1000, height: 700 })
        } else {
          setCanvasSize({ width: 1200, height: 800 })
        }
      }

      updateCanvasSize()
      window.addEventListener("resize", updateCanvasSize)
      return () => window.removeEventListener("resize", updateCanvasSize)
    }, [])

    const drawCanvas = useCallback(
      (
        targetCanvas?: HTMLCanvasElement,
        options?: {
          includeGrid?: boolean
          includeSelection?: boolean
          backgroundColor?: string
          transparent?: boolean
        },
      ) => {
        const canvas = (ref as React.RefObject<HTMLCanvasElement>)?.current || targetCanvas
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const {
          includeGrid = true,
          includeSelection = true,
          backgroundColor = "#ffffff",
          transparent = false,
        } = options || {}

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Set background
        if (!transparent) {
          ctx.fillStyle = backgroundColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        ctx.save()
        ctx.translate(panOffset.x, panOffset.y)
        ctx.scale(zoom, zoom)

        // Draw grid (only if enabled)
        if (includeGrid) {
          ctx.strokeStyle = "#f1f5f9"
          ctx.lineWidth = 1 / zoom
          const gridSize = 20
          const startX = Math.floor(-panOffset.x / zoom / gridSize) * gridSize
          const startY = Math.floor(-panOffset.y / zoom / gridSize) * gridSize
          const endX = startX + canvas.width / zoom + gridSize
          const endY = startY + canvas.height / zoom + gridSize

          for (let x = startX; x <= endX; x += gridSize) {
            ctx.beginPath()
            ctx.moveTo(x, startY)
            ctx.lineTo(x, endY)
            ctx.stroke()
          }
          for (let y = startY; y <= endY; y += gridSize) {
            ctx.beginPath()
            ctx.moveTo(startX, y)
            ctx.lineTo(endX, y)
            ctx.stroke()
          }
        }

        // Draw elements (only visible ones)
        canvasState.elements.forEach((element) => {
          if (element.visible === false) return

          ctx.strokeStyle = element.color
          ctx.fillStyle = element.color
          ctx.lineWidth = element.strokeWidth

          if (element.type === "image" && element.imageData) {
            const img = new Image()
            img.onload = () => {
              ctx.drawImage(
                img,
                element.x,
                element.y,
                element.width || element.imageWidth || 0,
                element.height || element.imageHeight || 0,
              )

              // Draw selection border for images
              if (includeSelection && canvasState.selectedElementId === element.id) {
                ctx.strokeStyle = "#06b6d4"
                ctx.lineWidth = 2 / zoom
                ctx.setLineDash([5 / zoom, 5 / zoom])
                ctx.strokeRect(
                  element.x,
                  element.y,
                  element.width || element.imageWidth || 0,
                  element.height || element.imageHeight || 0,
                )
                ctx.setLineDash([])
              }
            }
            img.src = element.imageData
            return
          }

          if (element.type === "brush" && element.points) {
            ctx.beginPath()
            element.points.forEach((point, index) => {
              if (index === 0) {
                ctx.moveTo(point.x, point.y)
              } else {
                ctx.lineTo(point.x, point.y)
              }
            })
            ctx.stroke()
          } else if (element.type === "rectangle") {
            ctx.beginPath()
            ctx.rect(element.x, element.y, element.width || 0, element.height || 0)
            if (fillMode) {
              ctx.fill()
            }
            ctx.stroke()
          } else if (element.type === "circle") {
            ctx.beginPath()
            ctx.arc(element.x, element.y, element.radius || 0, 0, 2 * Math.PI)
            if (fillMode) {
              ctx.fill()
            }
            ctx.stroke()
          } else if (element.type === "line") {
            ctx.beginPath()
            ctx.moveTo(element.x, element.y)
            ctx.lineTo(element.endX || element.x, element.endY || element.y)
            ctx.stroke()
          } else if (element.type === "triangle") {
            const width = element.width || 0
            const height = element.height || 0
            ctx.beginPath()
            ctx.moveTo(element.x + width / 2, element.y)
            ctx.lineTo(element.x, element.y + height)
            ctx.lineTo(element.x + width, element.y + height)
            ctx.closePath()
            if (fillMode) {
              ctx.fill()
            }
            ctx.stroke()
          } else if (element.type === "star") {
            const radius = element.radius || 0
            const spikes = 5
            const outerRadius = radius
            const innerRadius = radius * 0.5
            ctx.beginPath()
            for (let i = 0; i < spikes * 2; i++) {
              const angle = (i * Math.PI) / spikes
              const r = i % 2 === 0 ? outerRadius : innerRadius
              const x = element.x + Math.cos(angle - Math.PI / 2) * r
              const y = element.y + Math.sin(angle - Math.PI / 2) * r
              if (i === 0) {
                ctx.moveTo(x, y)
              } else {
                ctx.lineTo(x, y)
              }
            }
            ctx.closePath()
            if (fillMode) {
              ctx.fill()
            }
            ctx.stroke()
          } else if (element.type === "polygon") {
            const radius = element.radius || 0
            const sides = 6
            ctx.beginPath()
            for (let i = 0; i < sides; i++) {
              const angle = (i * 2 * Math.PI) / sides
              const x = element.x + Math.cos(angle - Math.PI / 2) * radius
              const y = element.y + Math.sin(angle - Math.PI / 2) * radius
              if (i === 0) {
                ctx.moveTo(x, y)
              } else {
                ctx.lineTo(x, y)
              }
            }
            ctx.closePath()
            if (fillMode) {
              ctx.fill()
            }
            ctx.stroke()
          } else if (element.type === "text" && element.text) {
            ctx.font = `${element.fontSize || 16}px ${element.fontFamily || "Arial"}`
            ctx.textAlign = element.textAlign || "left"
            ctx.fillText(element.text, element.x, element.y)
          }

          // Draw selection indicators for non-image elements
          if (includeSelection && canvasState.selectedElementId === element.id && element.type !== "image") {
            ctx.strokeStyle = "#06b6d4"
            ctx.lineWidth = 2 / zoom
            ctx.setLineDash([5 / zoom, 5 / zoom])

            if (element.type === "rectangle" || element.type === "triangle") {
              ctx.strokeRect(element.x, element.y, element.width || 0, element.height || 0)
            } else if (element.type === "circle" || element.type === "star" || element.type === "polygon") {
              ctx.beginPath()
              ctx.arc(element.x, element.y, (element.radius || 0) + 5, 0, 2 * Math.PI)
              ctx.stroke()
            } else if (element.type === "line") {
              ctx.beginPath()
              ctx.arc(element.x, element.y, 5, 0, 2 * Math.PI)
              ctx.stroke()
              ctx.beginPath()
              ctx.arc(element.endX || element.x, element.endY || element.y, 5, 0, 2 * Math.PI)
              ctx.stroke()
            } else if (element.type === "text") {
              const metrics = ctx.measureText(element.text || "")
              ctx.strokeRect(element.x, element.y - (element.fontSize || 16), metrics.width, element.fontSize || 16)
            }

            ctx.setLineDash([])
          }
        })

        ctx.restore()
      },
      [canvasState, fillMode, panOffset, zoom, ref],
    )

    useEffect(() => {
      drawCanvas()
    }, [drawCanvas])

    return (
      <div className="flex-1 p-2 md:p-6 overflow-auto">
        <div className="flex items-center justify-center min-h-full">
          <div className="relative border border-border rounded-lg shadow-lg bg-white max-w-full">
            <canvas
              ref={ref}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onWheel={onWheel}
              width={canvasSize.width}
              height={canvasSize.height}
              className="block cursor-crosshair max-w-full h-auto"
              style={{
                cursor: isPanning ? "grabbing" : tool === "select" ? "default" : tool === "pan" ? "grab" : "crosshair",
              }}
            />
          </div>
        </div>
      </div>
    )
  },
)

DrawingCanvas.displayName = "DrawingCanvas"
