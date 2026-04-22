import { ReactNode, useEffect, useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'lipaxe-dashboard-layout-v1';

export interface DashboardWidget {
  id: string;
  /** Where the widget should sit in the grid. */
  column: 'side' | 'main' | 'full';
  render: () => ReactNode;
}

interface SortableItemProps {
  id: string;
  editing: boolean;
  children: ReactNode;
}

const SortableItem = ({ id, editing, children }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className={cn('relative', editing && 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background rounded-2xl')}>
      {editing && (
        <button
          aria-label="Drag handle"
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-10 h-8 w-8 rounded-lg bg-background/90 backdrop-blur border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
};

interface Props {
  widgets: DashboardWidget[];
}

const loadOrder = (defaults: string[]): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const arr = JSON.parse(raw) as string[];
    if (!Array.isArray(arr)) return defaults;
    // Drop unknown ids and append any new defaults that weren't saved before.
    const valid = arr.filter((id) => defaults.includes(id));
    defaults.forEach((id) => { if (!valid.includes(id)) valid.push(id); });
    return valid;
  } catch { return defaults; }
};

export const SortableDashboard = ({ widgets }: Props) => {
  const defaultOrder = widgets.map((w) => w.id);
  const [order, setOrder] = useState<string[]>(() => loadOrder(defaultOrder));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch {}
  }, [order]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setOrder((prev) => arrayMove(prev, prev.indexOf(String(active.id)), prev.indexOf(String(over.id))));
  };

  const ordered = order.map((id) => widgets.find((w) => w.id === id)).filter(Boolean) as DashboardWidget[];
  const side = ordered.filter((w) => w.column === 'side');
  const main = ordered.filter((w) => w.column === 'main');
  const full = ordered.filter((w) => w.column === 'full');

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {editing && (
          <Button variant="ghost" size="sm" onClick={() => setOrder(defaultOrder)}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Réinitialiser
          </Button>
        )}
        <Button
          variant={editing ? 'default' : 'outline'}
          size="sm"
          onClick={() => setEditing((e) => !e)}
          className={editing ? 'bg-gradient-brand shadow-brand' : ''}
        >
          <Settings2 className="mr-2 h-3.5 w-3.5" />
          {editing ? 'Terminer' : 'Personnaliser'}
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
              {side.map((w) => <SortableItem key={w.id} id={w.id} editing={editing}>{w.render()}</SortableItem>)}
            </div>
            <div className="lg:col-span-2 space-y-6">
              {main.map((w) => <SortableItem key={w.id} id={w.id} editing={editing}>{w.render()}</SortableItem>)}
            </div>
          </div>
          <div className="space-y-6">
            {full.map((w) => <SortableItem key={w.id} id={w.id} editing={editing}>{w.render()}</SortableItem>)}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
