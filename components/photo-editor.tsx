"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Upload,
  ImageIcon,
  Palette,
  Download,
  RotateCw,
  Crop,
  Sliders,
  Undo,
  Redo,
  Square,
  Settings,
} from "lucide-react"

interface ImageAdjustments {
  brightness: number
  contrast: number
  saturation: number
  rotation: number
  hue: number
  blur: number
  sepia: number
  grayscale: number
  invert: number
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface ExportSettings {
  format: "jpeg" | "png" | "webp"
  quality: number
  width: number
  height: number
}

export function PhotoEditor() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    rotation: 0,
    hue: 0,
    blur: 0,
    sepia: 0,
    grayscale: 0,
    invert: 0,
  })
  const [history, setHistory] = useState<ImageAdjustments[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [cropArea, setCropArea] = useState<CropArea | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: "jpeg",
    quality: 90,
    width: 1920,
    height: 1080,
  })
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const exportCanvasRef = useRef<HTMLCanvasElement>(null)

  const drawImageToCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !selectedImage) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()

    if (adjustments.rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((adjustments.rotation * Math.PI) / 180)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)
    }

    const filters = []
    if (adjustments.brightness !== 100) {
      filters.push(`brightness(${adjustments.brightness}%)`)
    }
    if (adjustments.contrast !== 100) {
      filters.push(`contrast(${adjustments.contrast}%)`)
    }
    if (adjustments.saturation !== 100) {
      filters.push(`saturate(${adjustments.saturation}%)`)
    }
    if (adjustments.hue !== 0) {
      filters.push(`hue-rotate(${adjustments.hue}deg)`)
    }
    if (adjustments.blur > 0) {
      filters.push(`blur(${adjustments.blur}px)`)
    }
    if (adjustments.sepia > 0) {
      filters.push(`sepia(${adjustments.sepia}%)`)
    }
    if (adjustments.grayscale > 0) {
      filters.push(`grayscale(${adjustments.grayscale}%)`)
    }
    if (adjustments.invert > 0) {
      filters.push(`invert(${adjustments.invert}%)`)
    }

    ctx.filter = filters.join(" ")

    if (cropArea) {
      ctx.drawImage(image, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, canvas.width, canvas.height)
    } else {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    }

    ctx.restore()
  }, [selectedImage, adjustments, cropArea])

  const renderExportCanvas = useCallback(() => {
    const exportCanvas = exportCanvasRef.current
    const image = imageRef.current
    if (!exportCanvas || !image || !selectedImage) return

    const ctx = exportCanvas.getContext("2d")
    if (!ctx) return

    // Set export canvas size
    exportCanvas.width = exportSettings.width
    exportCanvas.height = exportSettings.height

    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height)
    ctx.save()

    // Calculate scaling to fit image in export dimensions
    const sourceWidth = cropArea ? cropArea.width : image.naturalWidth
    const sourceHeight = cropArea ? cropArea.height : image.naturalHeight
    const scale = Math.min(exportSettings.width / sourceWidth, exportSettings.height / sourceHeight)

    const scaledWidth = sourceWidth * scale
    const scaledHeight = sourceHeight * scale
    const offsetX = (exportSettings.width - scaledWidth) / 2
    const offsetY = (exportSettings.height - scaledHeight) / 2

    if (adjustments.rotation !== 0) {
      ctx.translate(exportCanvas.width / 2, exportCanvas.height / 2)
      ctx.rotate((adjustments.rotation * Math.PI) / 180)
      ctx.translate(-exportCanvas.width / 2, -exportCanvas.height / 2)
    }

    // Apply filters
    const filters = []
    if (adjustments.brightness !== 100) filters.push(`brightness(${adjustments.brightness}%)`)
    if (adjustments.contrast !== 100) filters.push(`contrast(${adjustments.contrast}%)`)
    if (adjustments.saturation !== 100) filters.push(`saturate(${adjustments.saturation}%)`)
    if (adjustments.hue !== 0) filters.push(`hue-rotate(${adjustments.hue}deg)`)
    if (adjustments.blur > 0) filters.push(`blur(${adjustments.blur}px)`)
    if (adjustments.sepia > 0) filters.push(`sepia(${adjustments.sepia}%)`)
    if (adjustments.grayscale > 0) filters.push(`grayscale(${adjustments.grayscale}%)`)
    if (adjustments.invert > 0) filters.push(`invert(${adjustments.invert}%)`)

    ctx.filter = filters.join(" ")

    if (cropArea) {
      ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight,
      )
    } else {
      ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight)
    }

    ctx.restore()
  }, [selectedImage, adjustments, cropArea, exportSettings])

  useEffect(() => {
    if (selectedImage && imageRef.current?.complete) {
      drawImageToCanvas()
    }
  }, [drawImageToCanvas, selectedImage])

  const handleExport = async () => {
    if (!selectedImage || !exportCanvasRef.current) return

    setIsExporting(true)

    try {
      // Render the final image to export canvas
      renderExportCanvas()

      // Convert canvas to blob
      const mimeType =
        exportSettings.format === "png" ? "image/png" : exportSettings.format === "webp" ? "image/webp" : "image/jpeg"

      const quality = exportSettings.format === "png" ? undefined : exportSettings.quality / 100

      exportCanvasRef.current.toBlob(
        (blob) => {
          if (!blob) return

          // Create download link
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `edited-photo.${exportSettings.format}`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          setShowExportDialog(false)
          setIsExporting(false)
        },
        mimeType,
        quality,
      )
    } catch (error) {
      console.error("Export failed:", error)
      setIsExporting(false)
    }
  }

  const updateExportDimensions = () => {
    if (imageRef.current) {
      const img = imageRef.current
      setExportSettings((prev) => ({
        ...prev,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }))
    }
  }

  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ ...adjustments })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex, adjustments])

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setAdjustments(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setAdjustments(history[historyIndex + 1])
    }
  }

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        const initialAdjustments = {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          rotation: 0,
          hue: 0,
          blur: 0,
          sepia: 0,
          grayscale: 0,
          invert: 0,
        }
        setAdjustments(initialAdjustments)
        setHistory([initialAdjustments])
        setHistoryIndex(0)
        setActiveTool(null)
        setCropArea(null)
        setIsCropping(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageLoad = () => {
    drawImageToCanvas()
    updateExportDimensions()
  }

  const handleAdjustmentChange = (key: keyof ImageAdjustments, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }))
  }

  const handleRotate = () => {
    const newRotation = (adjustments.rotation + 90) % 360
    setAdjustments((prev) => ({ ...prev, rotation: newRotation }))
    saveToHistory()
  }

  const resetAdjustments = () => {
    const resetValues = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      hue: 0,
      blur: 0,
      sepia: 0,
      grayscale: 0,
      invert: 0,
    }
    setAdjustments(resetValues)
    saveToHistory()
  }

  const applyPresetFilter = (filterName: string) => {
    let newAdjustments = { ...adjustments }

    switch (filterName) {
      case "vintage":
        newAdjustments = { ...newAdjustments, sepia: 60, contrast: 110, brightness: 90 }
        break
      case "bw":
        newAdjustments = { ...newAdjustments, grayscale: 100 }
        break
      case "warm":
        newAdjustments = { ...newAdjustments, hue: 15, saturation: 120, brightness: 105 }
        break
      case "cool":
        newAdjustments = { ...newAdjustments, hue: -15, saturation: 110, brightness: 95 }
        break
      case "dramatic":
        newAdjustments = { ...newAdjustments, contrast: 140, saturation: 80, brightness: 85 }
        break
      case "soft":
        newAdjustments = { ...newAdjustments, blur: 1, brightness: 110, contrast: 90 }
        break
    }

    setAdjustments(newAdjustments)
    saveToHistory()
  }

  const startCrop = () => {
    setIsCropping(true)
    setActiveTool("crop")
    if (imageRef.current) {
      const img = imageRef.current
      const cropSize = Math.min(img.naturalWidth, img.naturalHeight) * 0.8
      setCropArea({
        x: (img.naturalWidth - cropSize) / 2,
        y: (img.naturalHeight - cropSize) / 2,
        width: cropSize,
        height: cropSize,
      })
    }
  }

  const applyCrop = () => {
    if (cropArea && canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = cropArea.width
      canvas.height = cropArea.height

      drawImageToCanvas()
      setIsCropping(false)
      setCropArea(null)
      setActiveTool(null)
      saveToHistory()
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 bg-sidebar border-r border-sidebar-border p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-6">
          <ImageIcon className="w-6 h-6 text-sidebar-primary" />
          <h1 className="text-xl font-bold text-sidebar-foreground">PhotoEdit</h1>
        </div>

        <Card className="p-4 bg-sidebar-accent">
          <h2 className="text-sm font-semibold text-sidebar-accent-foreground mb-3">Upload Photo</h2>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const files = e.target.files
              if (files && files.length > 0) {
                handleFileSelect(files[0])
              }
            }}
            className="hidden"
          />
        </Card>

        <Card className="p-4 bg-sidebar-accent">
          <h2 className="text-sm font-semibold text-sidebar-accent-foreground mb-3">Tools</h2>
          <div className="space-y-2">
            <Button
              variant={activeTool === "crop" ? "default" : "ghost"}
              className="w-full justify-start text-sidebar-accent-foreground hover:bg-sidebar-border"
              onClick={startCrop}
              disabled={!selectedImage}
            >
              <Crop className="w-4 h-4 mr-2" />
              Crop
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-accent-foreground hover:bg-sidebar-border"
              onClick={handleRotate}
              disabled={!selectedImage}
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Rotate
            </Button>
            <Button
              variant={activeTool === "adjust" ? "default" : "ghost"}
              className="w-full justify-start text-sidebar-accent-foreground hover:bg-sidebar-border"
              onClick={() => setActiveTool(activeTool === "adjust" ? null : "adjust")}
              disabled={!selectedImage}
            >
              <Sliders className="w-4 h-4 mr-2" />
              Adjust
            </Button>
            <Button
              variant={activeTool === "filters" ? "default" : "ghost"}
              className="w-full justify-start text-sidebar-accent-foreground hover:bg-sidebar-border"
              onClick={() => setActiveTool(activeTool === "filters" ? null : "filters")}
              disabled={!selectedImage}
            >
              <Palette className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </Card>

        {activeTool === "adjust" && selectedImage && (
          <Card className="p-4 bg-sidebar-accent">
            <h2 className="text-sm font-semibold text-sidebar-accent-foreground mb-3">Adjustments</h2>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              <div>
                <label className="text-xs text-sidebar-accent-foreground mb-2 block">
                  Brightness: {adjustments.brightness}%
                </label>
                <Slider
                  value={[adjustments.brightness]}
                  onValueChange={([value]) => handleAdjustmentChange("brightness", value)}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-sidebar-accent-foreground mb-2 block">
                  Contrast: {adjustments.contrast}%
                </label>
                <Slider
                  value={[adjustments.contrast]}
                  onValueChange={([value]) => handleAdjustmentChange("contrast", value)}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-sidebar-accent-foreground mb-2 block">
                  Saturation: {adjustments.saturation}%
                </label>
                <Slider
                  value={[adjustments.saturation]}
                  onValueChange={([value]) => handleAdjustmentChange("saturation", value)}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-sidebar-accent-foreground mb-2 block">Hue: {adjustments.hue}°</label>
                <Slider
                  value={[adjustments.hue]}
                  onValueChange={([value]) => handleAdjustmentChange("hue", value)}
                  min={-180}
                  max={180}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-sidebar-accent-foreground mb-2 block">Blur: {adjustments.blur}px</label>
                <Slider
                  value={[adjustments.blur]}
                  onValueChange={([value]) => handleAdjustmentChange("blur", value)}
                  min={0}
                  max={10}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <Button variant="outline" size="sm" onClick={resetAdjustments} className="w-full bg-transparent">
                Reset All
              </Button>
            </div>
          </Card>
        )}

        {activeTool === "filters" && selectedImage && (
          <Card className="p-4 bg-sidebar-accent">
            <h2 className="text-sm font-semibold text-sidebar-accent-foreground mb-3">Filters</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xs text-sidebar-accent-foreground mb-2">Presets</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => applyPresetFilter("vintage")}>
                    Vintage
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => applyPresetFilter("bw")}>
                    B&W
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => applyPresetFilter("warm")}>
                    Warm
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => applyPresetFilter("cool")}>
                    Cool
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => applyPresetFilter("dramatic")}>
                    Dramatic
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => applyPresetFilter("soft")}>
                    Soft
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-sidebar-accent-foreground mb-2 block">
                    Sepia: {adjustments.sepia}%
                  </label>
                  <Slider
                    value={[adjustments.sepia]}
                    onValueChange={([value]) => handleAdjustmentChange("sepia", value)}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-sidebar-accent-foreground mb-2 block">
                    Grayscale: {adjustments.grayscale}%
                  </label>
                  <Slider
                    value={[adjustments.grayscale]}
                    onValueChange={([value]) => handleAdjustmentChange("grayscale", value)}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-sidebar-accent-foreground mb-2 block">
                    Invert: {adjustments.invert}%
                  </label>
                  <Slider
                    value={[adjustments.invert]}
                    onValueChange={([value]) => handleAdjustmentChange("invert", value)}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {isCropping && (
          <Card className="p-4 bg-sidebar-accent">
            <h2 className="text-sm font-semibold text-sidebar-accent-foreground mb-3">Crop</h2>
            <div className="space-y-2">
              <Button
                onClick={applyCrop}
                className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
              >
                <Square className="w-4 h-4 mr-2" />
                Apply Crop
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCropping(false)
                  setCropArea(null)
                  setActiveTool(null)
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-4 bg-sidebar-accent mt-auto">
          <Button
            disabled={!selectedImage}
            onClick={() => setShowExportDialog(true)}
            className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </Card>

        {showExportDialog && (
          <Card className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 p-6 bg-card border shadow-lg z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">Export Settings</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExportDialog(false)}
                className="text-card-foreground"
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">Format</label>
                <Select
                  value={exportSettings.format}
                  onValueChange={(value: "jpeg" | "png" | "webp") =>
                    setExportSettings((prev) => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {exportSettings.format !== "png" && (
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-2 block">
                    Quality: {exportSettings.quality}%
                  </label>
                  <Slider
                    value={[exportSettings.quality]}
                    onValueChange={([value]) => setExportSettings((prev) => ({ ...prev, quality: value }))}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-2 block">Width</label>
                  <input
                    type="number"
                    value={exportSettings.width}
                    onChange={(e) =>
                      setExportSettings((prev) => ({ ...prev, width: Number.parseInt(e.target.value) || 1920 }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-2 block">Height</label>
                  <input
                    type="number"
                    value={exportSettings.height}
                    onChange={(e) =>
                      setExportSettings((prev) => ({ ...prev, height: Number.parseInt(e.target.value) || 1080 }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isExporting ? (
                    <>
                      <Settings className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowExportDialog(false)} disabled={isExporting}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-card-foreground">
            {selectedImage ? (isCropping ? "Crop Photo" : "Edit Photo") : "No Photo Selected"}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="w-4 h-4 mr-1" />
              Undo
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="w-4 h-4 mr-1" />
              Redo
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6">
          {selectedImage ? (
            <div className="h-full flex items-center justify-center">
              <div className="relative max-w-full max-h-full border border-border rounded-lg overflow-hidden shadow-lg">
                <img
                  ref={imageRef}
                  src={selectedImage || "/placeholder.svg"}
                  alt="Source"
                  onLoad={handleImageLoad}
                  className="hidden"
                />
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `rotate(${adjustments.rotation}deg)`,
                    filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) hue-rotate(${adjustments.hue}deg) blur(${adjustments.blur}px) sepia(${adjustments.sepia}%) grayscale(${adjustments.grayscale}%) invert(${adjustments.invert}%)`,
                  }}
                />
                {isCropping && cropArea && (
                  <div
                    className="absolute border-2 border-primary bg-primary/10"
                    style={{
                      left: `${(cropArea.x / imageRef.current?.naturalWidth!) * 100}%`,
                      top: `${(cropArea.y / imageRef.current?.naturalHeight!) * 100}%`,
                      width: `${(cropArea.width / imageRef.current?.naturalWidth!) * 100}%`,
                      height: `${(cropArea.height / imageRef.current?.naturalHeight!) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div
              className={`h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const files = Array.from(e.dataTransfer.files)
                if (files.length > 0) {
                  handleFileSelect(files[0])
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Drop your photo here</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Drag and drop an image file, or click to browse your files
              </p>
              <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          )}
        </div>
      </div>

      <canvas ref={exportCanvasRef} className="hidden" />
    </div>
  )
}
