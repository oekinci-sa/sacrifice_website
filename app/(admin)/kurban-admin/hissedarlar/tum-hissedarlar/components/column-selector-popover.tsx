"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Table } from "@tanstack/react-table";
import { motion } from "framer-motion";
import { GripVertical, SlidersHorizontal } from "lucide-react";
import { useCallback, useState } from "react";

const EXCLUDED_IDS = ["security_code", "actions"];

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function ColumnItem({
  columnId,
  label,
  isVisible,
  onDragStart,
  onDrop,
}: {
  columnId: string;
  label: string;
  isVisible: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <motion.div
      layout
      layoutId={columnId}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop(e, columnId);
      }}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60",
        isDragOver && "ring-1 ring-primary/30 bg-muted/30"
      )}
    >
      <span
        draggable
        onDragStart={(e) => onDragStart(e, columnId)}
        className="touch-none p-0.5 -ml-0.5 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </span>
      <span className="flex-1 truncate">{label}</span>
    </motion.div>
  );
}

function DroppableSection({
  id,
  title,
  children,
  onDragOver,
  onDrop,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground px-2">{title}</p>
      <motion.div
        layout
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setIsOver(true);
          onDragOver(e);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsOver(false);
          onDrop(e);
        }}
        className={cn(
          "min-h-[32px] rounded-md border border-dashed transition-colors duration-200 space-y-0.5",
          isOver ? "border-primary/50 bg-muted/30" : "border-transparent"
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}

interface ColumnSelectorPopoverProps<TData> {
  table: Table<TData>;
  columnHeaderMap: Record<string, string>;
  columnOrder: string[];
  onColumnOrderChange?: (order: string[]) => void;
}

export function ColumnSelectorPopover<TData = unknown>({
  table,
  columnHeaderMap,
  columnOrder,
  onColumnOrderChange,
}: ColumnSelectorPopoverProps<TData>) {
  const allColumns = table
    .getAllColumns()
    .filter(
      (c) =>
        !EXCLUDED_IDS.includes(c.id) &&
        (typeof c.accessorFn !== "undefined" || c.id) &&
        c.getCanHide()
    );

  const visibleCols = table.getVisibleLeafColumns().filter((c) => allColumns.some((a) => a.id === c.id));
  const hiddenCols = allColumns.filter((c) => !c.getIsVisible());

  // Use columnOrder to sort visible items - ensures Sütunlar list matches table order
  const visibleItems = (() => {
    const items = visibleCols.map((c) => ({
      id: c.id,
      label: columnHeaderMap[c.id] || c.id,
    }));
    if (columnOrder.length > 0) {
      const orderMap = new Map(columnOrder.map((id, i) => [id, i]));
      return [...items].sort((a, b) => {
        const aOrder = orderMap.get(a.id) ?? 999;
        const bOrder = orderMap.get(b.id) ?? 999;
        return aOrder - bOrder;
      });
    }
    return items;
  })();
  const hiddenItems = hiddenCols.map((c) => ({
    id: c.id,
    label: columnHeaderMap[c.id] || c.id,
  }));

  const handleDragStart = useCallback((e: React.DragEvent, columnId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", columnId);
    // Custom drag image that follows the cursor
    const label = columnHeaderMap[columnId] || columnId;
    const dragEl = document.createElement("div");
    dragEl.className = "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm bg-background border shadow-lg";
    dragEl.style.cssText = "position:absolute;top:-9999px;left:0;z-index:9999;white-space:nowrap;";
    dragEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg><span>${label}</span>`;
    document.body.appendChild(dragEl);
    e.dataTransfer.setDragImage(dragEl, 12, 12);
    setTimeout(() => dragEl.parentNode?.removeChild(dragEl), 0);
  }, [columnHeaderMap]);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string, section: "visible" | "hidden") => {
      const columnId = e.dataTransfer.getData("text/plain");
      if (!columnId) return;

      const activeCol = allColumns.find((c) => c.id === columnId);
      if (!activeCol) return;

      const wasVisible = activeCol.getIsVisible();
      const targetIsVisible = visibleItems.some((i) => i.id === targetId);
      const targetIsHidden = hiddenItems.some((i) => i.id === targetId);

      if (section === "visible" || targetIsVisible) {
        if (!wasVisible) {
          activeCol.toggleVisibility(true);
          if (onColumnOrderChange) {
            const overIndex = visibleItems.findIndex((i) => i.id === targetId);
            const newOrder = [...visibleItems.map((i) => i.id)];
            const insertAt = overIndex >= 0 ? overIndex : newOrder.length;
            newOrder.splice(insertAt, 0, columnId);
            onColumnOrderChange(newOrder);
          }
        } else if (onColumnOrderChange) {
          const oldIndex = visibleItems.findIndex((i) => i.id === columnId);
          const newOrder = visibleItems.map((i) => i.id);
          const [removed] = newOrder.splice(oldIndex, 1);
          const overIndex = visibleItems.findIndex((i) => i.id === targetId);
          const insertAt = overIndex >= 0 ? (overIndex > oldIndex ? overIndex - 1 : overIndex) : newOrder.length;
          newOrder.splice(insertAt, 0, removed);
          onColumnOrderChange(newOrder);
        }
      } else if (section === "hidden" || targetIsHidden) {
        if (wasVisible) {
          activeCol.toggleVisibility(false);
          if (onColumnOrderChange) {
            const newOrder = visibleItems.filter((i) => i.id !== columnId).map((i) => i.id);
            onColumnOrderChange(newOrder);
          }
        }
      }
    },
    [allColumns, visibleItems, hiddenItems, onColumnOrderChange]
  );

  const handleSectionDrop = useCallback(
    (e: React.DragEvent, section: "visible" | "hidden") => {
      const columnId = e.dataTransfer.getData("text/plain");
      if (!columnId) return;

      const activeCol = allColumns.find((c) => c.id === columnId);
      if (!activeCol) return;

      const wasVisible = activeCol.getIsVisible();

      if (section === "visible") {
        if (!wasVisible) {
          activeCol.toggleVisibility(true);
          if (onColumnOrderChange) {
            onColumnOrderChange([...visibleItems.map((i) => i.id), columnId]);
          }
        }
      } else {
        if (wasVisible) {
          activeCol.toggleVisibility(false);
          if (onColumnOrderChange) {
            const newOrder = visibleItems.filter((i) => i.id !== columnId).map((i) => i.id);
            onColumnOrderChange(newOrder);
          }
        }
      }
    },
    [allColumns, visibleItems, onColumnOrderChange]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Sütunlar
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2" onCloseAutoFocus={(e) => e.preventDefault()}>
        <div className="space-y-4">
          <DroppableSection
            id="visible-section"
            title="Görünenler"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleSectionDrop(e, "visible")}
          >
            {visibleItems.map((item) => (
              <ColumnItem
                key={item.id}
                columnId={item.id}
                label={item.label}
                isVisible={true}
                onDragStart={handleDragStart}
                onDrop={(e) => handleDrop(e, item.id, "visible")}
              />
            ))}
          </DroppableSection>
          <DroppableSection
            id="hidden-section"
            title="Görünmeyenler"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleSectionDrop(e, "hidden")}
          >
            {hiddenItems.map((item) => (
              <ColumnItem
                key={item.id}
                columnId={item.id}
                label={item.label}
                isVisible={false}
                onDragStart={handleDragStart}
                onDrop={(e) => handleDrop(e, item.id, "hidden")}
              />
            ))}
          </DroppableSection>
        </div>
      </PopoverContent>
    </Popover>
  );
}
