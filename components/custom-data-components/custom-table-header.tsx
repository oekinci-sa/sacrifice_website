"use client"

import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Table as TableInstance, flexRender } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { useCallback, useRef, useState } from "react"

/** Sütun seçicide ve başlık sürüklemesinde — bu sütunlar yeniden sıralanmaz */
const HEADER_REORDER_EXCLUDED_IDS = ["security_code", "actions"] as const

/** Bu kadar piksel kaydırınca sürükleme kabul edilir */
const DRAG_SLOP_PX = 6

/** Hedef sütunun sol yarısı: öncesine; sağ yarısı: sonrasına yerleştir */
function reorderWithInsertEdge(
  visibleIds: string[],
  draggedId: string,
  targetId: string,
  insertAfter: boolean
): string[] {
  if (draggedId === targetId) return visibleIds
  const without = visibleIds.filter((id) => id !== draggedId)
  let insertIndex = without.indexOf(targetId)
  if (insertIndex < 0) return visibleIds
  if (insertAfter) insertIndex += 1
  without.splice(insertIndex, 0, draggedId)
  return without
}

function insertAfterFromPointer(el: HTMLElement, clientX: number): boolean {
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0) return false
  return clientX >= rect.left + rect.width / 2
}

function resolveDragLabel(
  table: TableInstance<unknown>,
  columnId: string,
  overrides?: Record<string, string>
): string {
  if (overrides?.[columnId]) return overrides[columnId]
  const col = table.getColumn(columnId)
  if (!col) return columnId
  const h = col.columnDef.header
  if (typeof h === "string") return h
  return columnId
}

type DropIndicator = { columnId: string; edge: "before" | "after" } | null

interface CustomTableHeaderProps<TData> {
  table: TableInstance<TData>
  tableSize?: "small" | "medium" | "large"
  columnHeaderLabels?: Record<string, string>
  onColumnOrderChange?: (order: string[]) => void
}

export function CustomTableHeader<TData>({
  table,
  tableSize = "medium",
  columnHeaderLabels,
  onColumnOrderChange,
}: CustomTableHeaderProps<TData>) {
  const headerSizeClasses = {
    small: "h-10 text-center text-xs md:text-sm py-1",
    medium: "h-12 text-center text-sm md:text-md py-2",
    large: "h-14 text-center text-sm md:text-lg py-3"
  }

  const arrowSizeClasses = {
    small: "h-2 w-2 md:h-3 md:w-3",
    medium: "h-3 w-3 md:h-4 md:w-4",
    large: "h-4 w-4 md:h-5 md:h-5"
  }

  const headerClass = headerSizeClasses[tableSize]
  const arrowClass = arrowSizeClasses[tableSize]

  const canReorder = Boolean(onColumnOrderChange)

  const dragInProgressRef = useRef(false)
  const pendingRef = useRef<{ columnId: string; x: number; y: number } | null>(null)
  const slopMetRef = useRef(false)
  const moveListenerRef = useRef<((e: PointerEvent) => void) | null>(null)
  const upListenerRef = useRef<(() => void) | null>(null)

  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null)

  const removeWindowListeners = useCallback(() => {
    if (moveListenerRef.current) {
      window.removeEventListener("pointermove", moveListenerRef.current)
      moveListenerRef.current = null
    }
    if (upListenerRef.current) {
      window.removeEventListener("pointerup", upListenerRef.current, true)
      window.removeEventListener("pointercancel", upListenerRef.current, true)
      upListenerRef.current = null
    }
  }, [])

  const disarmDrag = useCallback(() => {
    dragInProgressRef.current = false
    pendingRef.current = null
    slopMetRef.current = false
    setDraggingColumnId(null)
    setDropIndicator(null)
    removeWindowListeners()
  }, [removeWindowListeners])

  const armPointerGesture = useCallback(
    (columnId: string, clientX: number, clientY: number) => {
      removeWindowListeners()
      pendingRef.current = { columnId, x: clientX, y: clientY }
      slopMetRef.current = false

      const onMove = (ev: PointerEvent) => {
        const p = pendingRef.current
        if (!p) return
        const dx = ev.clientX - p.x
        const dy = ev.clientY - p.y
        if (Math.hypot(dx, dy) >= DRAG_SLOP_PX) {
          slopMetRef.current = true
        }
      }

      const onUp = () => {
        removeWindowListeners()
        if (!dragInProgressRef.current) {
          pendingRef.current = null
          slopMetRef.current = false
        }
      }

      moveListenerRef.current = onMove
      upListenerRef.current = onUp
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp, true)
      window.addEventListener("pointercancel", onUp, true)
    },
    [removeWindowListeners]
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent, columnId: string) => {
      if (!slopMetRef.current) {
        e.preventDefault()
        return
      }
      dragInProgressRef.current = true
      setDraggingColumnId(columnId)
      const label = resolveDragLabel(table as TableInstance<unknown>, columnId, columnHeaderLabels)
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", columnId)
      const dragEl = document.createElement("div")
      dragEl.className = "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm bg-background border shadow-lg"
      dragEl.style.cssText = "position:absolute;top:-9999px;left:0;z-index:9999;white-space:nowrap;"
      dragEl.textContent = label
      document.body.appendChild(dragEl)
      e.dataTransfer.setDragImage(dragEl, 12, 12)
      requestAnimationFrame(() => requestAnimationFrame(() => dragEl.remove()))
    },
    [columnHeaderLabels, table]
  )

  const handleDragEnd = useCallback(() => {
    disarmDrag()
  }, [disarmDrag])

  const updateDropIndicator = useCallback(
    (e: React.DragEvent, columnId: string, canDropHere: boolean) => {
      if (!canDropHere) return
      const types = e.dataTransfer?.types
      if (!types || !Array.from(types).includes("text/plain")) return
      const el = e.currentTarget as HTMLElement
      const insertAfter = insertAfterFromPointer(el, e.clientX)
      setDropIndicator({ columnId, edge: insertAfter ? "after" : "before" })
    },
    []
  )

  const handleHeaderDrop = useCallback(
    (e: React.DragEvent, targetColumnId: string) => {
      e.preventDefault()
      e.stopPropagation()
      setDropIndicator(null)

      const draggedId = e.dataTransfer.getData("text/plain")
      if (!draggedId || !onColumnOrderChange) return
      if (HEADER_REORDER_EXCLUDED_IDS.includes(draggedId as "actions" | "security_code")) return
      if (HEADER_REORDER_EXCLUDED_IDS.includes(targetColumnId as "actions" | "security_code")) return

      const col = table.getColumn(draggedId)
      const targetCol = table.getColumn(targetColumnId)
      if (!col?.getCanHide() || !targetCol?.getCanHide()) return

      const visibleIds = table
        .getVisibleLeafColumns()
        .map((c) => c.id)
        .filter((id) => !HEADER_REORDER_EXCLUDED_IDS.includes(id as "actions" | "security_code"))

      const insertAfter = insertAfterFromPointer(e.currentTarget as HTMLElement, e.clientX)
      const next = reorderWithInsertEdge(visibleIds, draggedId, targetColumnId, insertAfter)
      if (next.join(",") !== visibleIds.join(",")) {
        onColumnOrderChange(next)
      }
    },
    [onColumnOrderChange, table]
  )

  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow
          key={headerGroup.id}
          onDragLeave={(ev) => {
            if (!ev.currentTarget.contains(ev.relatedTarget as Node | null)) {
              setDropIndicator(null)
            }
          }}
        >
          {headerGroup.headers.map((header) => {
            const columnId = header.column.id
            const canReorderThis =
              canReorder &&
              !HEADER_REORDER_EXCLUDED_IDS.includes(columnId as "actions" | "security_code") &&
              header.column.getCanHide()

            const minSize = (header.column.columnDef as { minSize?: number }).minSize

            const showLineBefore =
              dropIndicator?.columnId === columnId && dropIndicator.edge === "before"
            const showLineAfter =
              dropIndicator?.columnId === columnId && dropIndicator.edge === "after"

            return (
              <TableHead
                key={header.id}
                draggable={canReorderThis}
                style={minSize != null ? { minWidth: `${minSize}px` } : undefined}
                className={`relative text-left align-middle font-medium text-muted-foreground font-sans whitespace-nowrap select-none [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] ${headerClass} ${draggingColumnId === columnId ? "cursor-grabbing opacity-60" : canReorderThis ? "cursor-grab" : ""}`}
                onPointerDownCapture={
                  canReorderThis
                    ? (e) => armPointerGesture(columnId, e.clientX, e.clientY)
                    : undefined
                }
                onDragStart={canReorderThis ? (e) => handleDragStart(e, columnId) : undefined}
                onDragEnd={canReorderThis ? handleDragEnd : undefined}
                onDragOver={
                  canReorderThis
                    ? (e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = "move"
                        updateDropIndicator(e, columnId, true)
                      }
                    : undefined
                }
                onDrop={canReorderThis ? (e) => handleHeaderDrop(e, columnId) : undefined}
              >
                {showLineBefore ? (
                  <span
                    className="pointer-events-none absolute left-0 top-1 bottom-1 z-20 w-0.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]"
                    aria-hidden
                  />
                ) : null}
                {showLineAfter ? (
                  <span
                    className="pointer-events-none absolute right-0 top-1 bottom-1 z-20 w-0.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]"
                    aria-hidden
                  />
                ) : null}
                {header.isPlaceholder ? null : (
                  <div className="flex items-center justify-center gap-1">
                    {typeof header.column.columnDef.header === "string" ? (
                      header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="flex items-center gap-2 cursor-pointer rounded hover:bg-muted hover:text-foreground px-1 -mx-1"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.column.columnDef.header}
                          {header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className={arrowClass} />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className={arrowClass} />
                          ) : (
                            <ArrowUpDown className={arrowClass} />
                          )}
                        </button>
                      ) : (
                        <>{header.column.columnDef.header}</>
                      )
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </div>
                )}
              </TableHead>
            )
          })}
        </TableRow>
      ))}
    </TableHeader>
  )
}
