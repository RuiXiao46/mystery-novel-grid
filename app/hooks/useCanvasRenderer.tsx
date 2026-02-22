"use client"

import { useState, useEffect, useCallback, RefObject } from "react"
import { MovieCell, GlobalConfig } from "../types"
import { CANVAS_CONFIG, isBrowser } from "../constants"
import { filmIconPath } from "../utils/canvas"

interface UseCanvasRendererProps {
  canvasRef: RefObject<HTMLCanvasElement>
  cells: MovieCell[]
  setCells: React.Dispatch<React.SetStateAction<MovieCell[]>>
  dragOverCellId: number | null
  globalConfig: GlobalConfig
}

export function useCanvasRenderer({
  canvasRef,
  cells,
  setCells,
  dragOverCellId,
  globalConfig,
}: UseCanvasRendererProps) {
  const [scale, setScale] = useState(1)

  const drawCanvasWithScale = (
    targetCanvas: HTMLCanvasElement,
    targetCells: MovieCell[],
    config: GlobalConfig,
    scaleFactor: number = 1
  ) => {
    const ctx = targetCanvas.getContext("2d")
    if (!ctx) return

    const width = CANVAS_CONFIG.width * scaleFactor
    const height = CANVAS_CONFIG.height * scaleFactor
    const padding = CANVAS_CONFIG.padding * scaleFactor
    const titleHeight = CANVAS_CONFIG.titleHeight * scaleFactor
    const titleBottomMargin = (CANVAS_CONFIG.titleBottomMargin || 0) * scaleFactor
    const cellPadding = CANVAS_CONFIG.cellPadding * scaleFactor
    const cellBorderWidth = CANVAS_CONFIG.cellBorderWidth * scaleFactor
    const cellBorderRadius = CANVAS_CONFIG.cellBorderRadius * scaleFactor

    try {
      ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height)

      ctx.fillStyle = "black"
      const baseFontSize = CANVAS_CONFIG.titleFontSize * scaleFactor
      ctx.font = `bold ${baseFontSize}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const title = config.mainTitle || ""
      const maxTitleWidth = width - padding * 2
      const titleMetrics = ctx.measureText(title)
      let titleFontSize = baseFontSize
      if (titleMetrics.width > maxTitleWidth && titleMetrics.width > 0) {
        const ratio = maxTitleWidth / titleMetrics.width
        titleFontSize = Math.max(12 * scaleFactor, Math.floor(baseFontSize * ratio))
        ctx.font = `bold ${titleFontSize}px sans-serif`
      }

      const titleY = padding + titleHeight / 2
      ctx.fillText(title, width / 2, titleY)

      const gridTop = padding + titleHeight + titleBottomMargin
      const gridWidth = width - padding * 2
      const gridHeight = height - gridTop - padding

      const cellWidth = gridWidth / CANVAS_CONFIG.gridCols
      const cellHeight = gridHeight / CANVAS_CONFIG.gridRows

      targetCells.forEach((cell, index) => {
        const row = Math.floor(index / CANVAS_CONFIG.gridCols)
        const col = index % CANVAS_CONFIG.gridCols

        const x = padding + col * cellWidth
        const y = gridTop + row * cellHeight

        ctx.strokeStyle = "black"
        ctx.lineWidth = cellBorderWidth

        if (dragOverCellId === cell.id) {
          ctx.strokeStyle = "#3b82f6"
          ctx.lineWidth = cellBorderWidth * 2
        }

        if (typeof ctx.roundRect === "function") {
          ctx.beginPath()
          ctx.roundRect(
            x + cellPadding / 2,
            y + cellPadding / 2,
            cellWidth - cellPadding,
            cellHeight - cellPadding,
            cellBorderRadius
          )
          ctx.stroke()
        } else {
          ctx.strokeRect(
            x + cellPadding / 2,
            y + cellPadding / 2,
            cellWidth - cellPadding,
            cellHeight - cellPadding
          )
        }

        const coverWidth = cellWidth - cellPadding * 2 - cellBorderWidth * 2
        const coverHeight = coverWidth / CANVAS_CONFIG.coverRatio
        const coverX = x + cellPadding + cellBorderWidth
        const coverY = y + cellPadding + cellBorderWidth

        if (cell.imageObj) {
          try {
            ctx.drawImage(cell.imageObj, coverX, coverY, coverWidth, coverHeight)
          } catch (error) {
            console.error(`Draw image failed: ${cell.name || index}`, error)
            drawPlaceholder(ctx, coverX, coverY, coverWidth, coverHeight)
          }
        } else {
          drawPlaceholder(ctx, coverX, coverY, coverWidth, coverHeight)
        }

        ctx.fillStyle = "black"
        const baseCellTitleFont = CANVAS_CONFIG.cellTitleFontSize * scaleFactor
        ctx.font = `${baseCellTitleFont}px sans-serif`
        ctx.textAlign = "center"

        const cellTitleMaxWidth = cellWidth - cellPadding * 2
        const cellTitleMetrics = ctx.measureText(cell.title)
        let cellTitleFontSize = baseCellTitleFont
        if (cellTitleMetrics.width > cellTitleMaxWidth && cellTitleMetrics.width > 0) {
          const ratio = cellTitleMaxWidth / cellTitleMetrics.width
          cellTitleFontSize = Math.max(10 * scaleFactor, Math.floor(baseCellTitleFont * ratio))
          ctx.font = `${cellTitleFontSize}px sans-serif`
        }

        const cellTitleMargin = CANVAS_CONFIG.cellTitleMargin * scaleFactor
        const titleAreaHeight = baseCellTitleFont
        const titleCenterY = coverY + cellTitleMargin + coverHeight + titleAreaHeight / 2

        const prevBaseline = ctx.textBaseline
        ctx.textBaseline = "middle"
        ctx.fillText(cell.title, x + cellWidth / 2, titleCenterY + 3 * scaleFactor)
        ctx.textBaseline = prevBaseline

        if (cell.name) {
          const prevBaseline2 = ctx.textBaseline
          ctx.textBaseline = "alphabetic"
          ctx.fillStyle = "#4b5563"

          const cellNameFontSize = CANVAS_CONFIG.cellNameFontSize * scaleFactor
          ctx.font = `${cellNameFontSize}px sans-serif`

          let movieName = cell.name
          let textWidth = ctx.measureText(movieName).width
          const maxWidth = cellWidth - cellPadding * 4
          if (textWidth > maxWidth) {
            let truncated = movieName
            while (textWidth > maxWidth && truncated.length > 0) {
              truncated = truncated.slice(0, -1)
              textWidth = ctx.measureText(truncated + "...").width
            }
            movieName = truncated + "..."
          }

          const cellNameMargin = CANVAS_CONFIG.cellNameMargin * scaleFactor
          ctx.fillText(
            movieName,
            x + cellWidth / 2,
            coverY + coverHeight + cellTitleMargin + baseCellTitleFont + cellNameMargin + cellNameFontSize
          )
          ctx.textBaseline = prevBaseline2
        }
      })

      ctx.fillStyle = "#9ca3af"
      ctx.font = `${14 * scaleFactor}px sans-serif`
      ctx.textAlign = "right"
      ctx.fillText("mysterygrid.top", width - padding, height - padding / 2)
    } catch (error) {
      console.error("Canvas draw error:", error)
    }
  }

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawCanvasWithScale(canvas, cells, globalConfig, 1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, globalConfig, dragOverCellId])

  useEffect(() => {
    if (!isBrowser || !canvasRef.current) return

    const updateScale = () => {
      if (!canvasRef.current) return

      const containerWidth = Math.min(window.innerWidth, 1200)
      const newScale = containerWidth / CANVAS_CONFIG.width
      setScale(newScale)

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = CANVAS_CONFIG.width * dpr
      canvas.height = CANVAS_CONFIG.height * dpr
      canvas.style.width = `${CANVAS_CONFIG.width * newScale}px`
      canvas.style.height = `${CANVAS_CONFIG.height * newScale}px`

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      requestAnimationFrame(() => {
        drawCanvas()
      })
    }

    updateScale()

    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(updateScale, 100)
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [drawCanvas, canvasRef])

  useEffect(() => {
    if (isBrowser) {
      requestAnimationFrame(() => {
        drawCanvas()
      })
    }
  }, [cells, dragOverCellId, drawCanvas])

  useEffect(() => {
    if (!isBrowser) return

    cells.forEach((cell, index) => {
      if (cell.image && !cell.imageObj) {
        try {
          const img = new window.Image()
          img.crossOrigin = "anonymous"
          img.onerror = (err) => {
            console.error(`Image load failed: ${cell.image}`, err)
          }
          img.onload = () => {
            setCells((prev) => {
              const newCells = [...prev]
              newCells[index] = { ...newCells[index], imageObj: img }
              return newCells
            })
          }
          img.src = cell.image
        } catch (error) {
          console.error("Create image object failed:", error)
        }
      }
    })
  }, [cells, setCells])

  function drawPlaceholder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    ctx.fillStyle = "#f3f4f6"
    ctx.fillRect(x, y, width, height)

    const iconSize = Math.min(width, height) * 0.4
    const iconX = x + (width - iconSize) / 2
    const iconY = y + (height - iconSize) / 2

    ctx.fillStyle = "#9ca3af"
    ctx.strokeStyle = "#9ca3af"
    ctx.lineWidth = 3

    filmIconPath(iconX, iconY, iconSize).forEach((cmd) => {
      if (cmd.cmd === "beginPath") {
        ctx.beginPath()
      } else if (cmd.cmd === "roundRect" && cmd.args && typeof ctx.roundRect === "function") {
        ctx.roundRect(
          cmd.args[0] as number,
          cmd.args[1] as number,
          cmd.args[2] as number,
          cmd.args[3] as number,
          cmd.args[4] as number
        )
      } else if (cmd.cmd === "arc" && cmd.args) {
        ctx.arc(
          cmd.args[0] as number,
          cmd.args[1] as number,
          cmd.args[2] as number,
          cmd.args[3] as number,
          cmd.args[4] as number
        )
      } else if (cmd.cmd === "moveTo" && cmd.args) {
        ctx.moveTo(cmd.args[0] as number, cmd.args[1] as number)
      } else if (cmd.cmd === "lineTo" && cmd.args) {
        ctx.lineTo(cmd.args[0] as number, cmd.args[1] as number)
      } else if (cmd.cmd === "bezierCurveTo" && cmd.args) {
        ctx.bezierCurveTo(
          cmd.args[0] as number,
          cmd.args[1] as number,
          cmd.args[2] as number,
          cmd.args[3] as number,
          cmd.args[4] as number,
          cmd.args[5] as number
        )
      } else if (cmd.cmd === "closePath") {
        ctx.closePath()
      } else if (cmd.cmd === "fill") {
        ctx.fill()
      } else if (cmd.cmd === "stroke") {
        ctx.stroke()
      }
    })
  }

  return {
    scale,
    drawCanvas,
    drawCanvasWithScale,
  }
}
