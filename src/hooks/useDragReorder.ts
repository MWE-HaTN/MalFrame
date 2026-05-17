import { useState, useCallback, useRef } from "react";

export function useDragReorder(onReorder: (fromIndex: number, toIndex: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((index: number) => {
    dragOverIndexRef.current = index;
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    dragOverIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    try {
      if (dragIndexRef.current !== null && dragOverIndexRef.current !== null && dragIndexRef.current !== dragOverIndexRef.current) {
        onReorderRef.current(dragIndexRef.current, dragOverIndexRef.current);
      }
    } finally {
      dragIndexRef.current = null;
      dragOverIndexRef.current = null;
      setDragIndex(null);
      setDragOverIndex(null);
    }
  }, []);

  const getDragProps = useCallback((index: number) => ({
    index,
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDragEnd: handleDragEnd,
    isDragging: dragIndex === index,
    isDragOver: dragOverIndex === index && dragIndex !== index
  }), [dragIndex, dragOverIndex, handleDragStart, handleDragOver, handleDragLeave, handleDragEnd]);

  return { getDragProps };
}
