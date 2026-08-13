import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Pencil, Trash2 } from "lucide-react";
import type { StrokePoint, WhiteboardStroke } from "@/lib/classroom";

const COLORS = ["#0f172a", "#f97316", "#2563eb", "#16a34a", "#dc2626"];

interface Props {
  strokes: WhiteboardStroke[];
  canDraw: boolean;
  onStroke: (stroke: Omit<WhiteboardStroke, "id" | "roomId" | "uid">) => void;
  onClear?: () => void;
}

export function Whiteboard({ strokes, canDraw, onStroke, onClear }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const currentRef = useRef<StrokePoint[]>([]);
  const [color, setColor] = useState(COLORS[0]);
  const [erase, setErase] = useState(false);
  const [width, setWidth] = useState(3);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, s: { points: StrokePoint[]; color: string; width: number; erase?: boolean }, w: number, h: number) => {
    if (s.points.length === 0) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = s.erase ? "#ffffff" : s.color;
    ctx.lineWidth = (s.erase ? s.width * 6 : s.width) * (w / 1000);
    ctx.beginPath();
    ctx.moveTo(s.points[0].x * w, s.points[0].y * h);
    s.points.forEach(p => ctx.lineTo(p.x * w, p.y * h));
    ctx.stroke();
    ctx.restore();
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    strokes.forEach(s => drawStroke(ctx, s, rect.width, rect.height));
  }, [strokes, drawStroke]);

  useEffect(() => {
    redraw();
    const ro = new ResizeObserver(() => redraw());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [redraw]);

  const pointFrom = (e: React.PointerEvent) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };

  const handleDown = (e: React.PointerEvent) => {
    if (!canDraw) return;
    drawingRef.current = true;
    currentRef.current = [pointFrom(e)];
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const p = pointFrom(e);
    currentRef.current.push(p);
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    const rect = wrap.getBoundingClientRect();
    if (ctx) drawStroke(ctx, { points: currentRef.current, color, width, erase }, rect.width, rect.height);
  };

  const handleUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const points = currentRef.current;
    currentRef.current = [];
    if (points.length < 2) return;
    onStroke({ points, color, width, erase, createdAt: new Date().toISOString() });
  };

  return (
    <div className="relative h-full w-full bg-white rounded-xl overflow-hidden">
      <div
        ref={wrapRef}
        className="h-full w-full touch-none"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      {canDraw && (
        <div className="absolute right-3 top-3 flex flex-col gap-2 rounded-xl bg-slate-900/90 p-2 shadow-lg">
          <Button
            size="icon"
            variant={erase ? "ghost" : "secondary"}
            className="h-8 w-8"
            onClick={() => setErase(false)}
            aria-label="Pen"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {COLORS.map(c => (
            <button
              key={c}
              aria-label={`Colour ${c}`}
              onClick={() => {
                setColor(c);
                setErase(false);
              }}
              className={`h-6 w-6 rounded-full border-2 ${
                color === c && !erase ? "border-white" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            aria-label="Brush size"
            type="range"
            min={1}
            max={10}
            value={width}
            onChange={e => setWidth(Number(e.target.value))}
            className="w-8 accent-primary"
          />
          <Button
            size="icon"
            variant={erase ? "secondary" : "ghost"}
            className="h-8 w-8"
            onClick={() => setErase(true)}
            aria-label="Eraser"
          >
            <Eraser className="h-4 w-4" />
          </Button>
          {onClear && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClear} aria-label="Clear board">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
