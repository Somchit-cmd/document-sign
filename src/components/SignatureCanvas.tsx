'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PenLine,
  Type,
  Upload,
  RotateCcw,
  Undo2,
  Check,
  X,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

interface SignatureCanvasProps {
  onApply: (signatureData: string, type: 'drawn' | 'typed' | 'uploaded') => void;
  onCancel: () => void;
  signerName?: string;
  isSubmitting?: boolean;
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

const PEN_COLORS = [
  { value: '#1a1a1a', label: 'Black' },
  { value: '#1e40af', label: 'Navy' },
  { value: '#065f46', label: 'Forest' },
  { value: '#7c2d12', label: 'Brown' },
];

const PEN_WIDTHS = [
  { value: 1.5, label: 'Thin' },
  { value: 2.5, label: 'Medium' },
  { value: 4, label: 'Thick' },
];

const SCRIPT_FONTS = [
  { value: "'Dancing Script', cursive", label: 'Dancing Script' },
  { value: "'Great Vibes', cursive", label: 'Great Vibes' },
  { value: "'Pacifico', cursive", label: 'Pacifico' },
  { value: "italic", label: 'Serif Italic' },
];

export function SignatureCanvas({
  onApply,
  onCancel,
  signerName = '',
  isSubmitting = false,
}: SignatureCanvasProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [penColor, setPenColor] = useState('#1a1a1a');
  const [penWidth, setPenWidth] = useState(2.5);
  const [typedSignature, setTypedSignature] = useState(signerName);
  const [selectedFont, setSelectedFont] = useState(SCRIPT_FONTS[0].value);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [previewSignature, setPreviewSignature] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas sizing
  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 180;

  // Draw all strokes on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw signature line
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 30);
    ctx.lineTo(canvas.width - 30, canvas.height - 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw "Sign here" text
    ctx.fillStyle = '#d1d5db';
    ctx.font = '10px sans-serif';
    ctx.fillText('Sign here', 30, canvas.height - 14);

    // Draw all strokes
    const allStrokes = [...strokes];
    if (currentStroke) allStrokes.push(currentStroke);

    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const prev = stroke.points[i - 1];
        const curr = stroke.points[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }

      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
  }, [strokes, currentStroke]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Mouse handlers
  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const getTouchPos = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const pos = getCanvasPos(e);
      setIsDrawing(true);
      setCurrentStroke({
        points: [pos],
        color: penColor,
        width: penWidth,
      });
    },
    [getCanvasPos, penColor, penWidth]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !currentStroke) return;
      e.preventDefault();
      const pos = getCanvasPos(e);
      setCurrentStroke((prev) =>
        prev ? { ...prev, points: [...prev.points, pos] } : null
      );
    },
    [isDrawing, currentStroke, getCanvasPos]
  );

  const stopDrawing = useCallback(() => {
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
    setIsDrawing(false);
  }, [currentStroke]);

  // Touch handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const pos = getTouchPos(e);
      setIsDrawing(true);
      setCurrentStroke({
        points: [pos],
        color: penColor,
        width: penWidth,
      });
    },
    [getTouchPos, penColor, penWidth]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !currentStroke) return;
      e.preventDefault();
      const pos = getTouchPos(e);
      setCurrentStroke((prev) =>
        prev ? { ...prev, points: [...prev.points, pos] } : null
      );
    },
    [isDrawing, currentStroke, getTouchPos]
  );

  const handleTouchEnd = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  // Actions
  const clearCanvas = useCallback(() => {
    setStrokes([]);
    setCurrentStroke(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    redrawCanvas();
  }, [redrawCanvas]);

  const undoStroke = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  // File upload
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setUploadedFileName(file.name);
        toast.success('Signature image uploaded');
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Generate signature data based on active tab
  const generateSignatureData = useCallback((): { data: string; type: 'drawn' | 'typed' | 'uploaded' } | null => {
    if (activeTab === 'draw') {
      if (strokes.length === 0) {
        toast.error('Please draw your signature');
        return null;
      }
      const canvas = canvasRef.current;
      if (!canvas) return null;

      // Create a clean canvas for export (without the "sign here" line)
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return null;

      // Draw strokes on export canvas
      for (const stroke of strokes) {
        if (stroke.points.length < 2) continue;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          const prev = stroke.points[i - 1];
          const curr = stroke.points[i];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }

      return { data: exportCanvas.toDataURL('image/png'), type: 'drawn' };
    } else if (activeTab === 'type') {
      if (!typedSignature.trim()) {
        toast.error('Please type your signature');
        return null;
      }
      // Render typed signature to canvas for consistent format
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = penColor;
      const fontSize = Math.min(48, canvas.width / typedSignature.length * 1.8);
      ctx.font = `${selectedFont.includes('italic') ? 'italic' : ''} ${fontSize}px ${selectedFont.includes('italic') ? 'Georgia, serif' : selectedFont}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2 - 10);

      return { data: canvas.toDataURL('image/png'), type: 'typed' };
    } else if (activeTab === 'upload') {
      if (!uploadedImage) {
        toast.error('Please upload a signature image');
        return null;
      }
      return { data: uploadedImage, type: 'uploaded' };
    }
    return null;
  }, [activeTab, strokes, typedSignature, selectedFont, penColor, uploadedImage]);

  // Preview signature
  const handlePreview = useCallback(() => {
    const result = generateSignatureData();
    if (result) {
      setPreviewSignature(result.data);
    }
  }, [generateSignatureData]);

  // Apply signature
  const handleApply = useCallback(() => {
    const result = generateSignatureData();
    if (result) {
      onApply(result.data, result.type);
    }
  }, [generateSignatureData, onApply]);

  const hasDrawn = strokes.length > 0;
  const hasTyped = typedSignature.trim().length > 0;
  const hasUploaded = !!uploadedImage;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'draw' | 'type' | 'upload')}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="draw" className="gap-1.5 text-xs">
            <PenLine className="h-3.5 w-3.5" />
            Draw
          </TabsTrigger>
          <TabsTrigger value="type" className="gap-1.5 text-xs">
            <Type className="h-3.5 w-3.5" />
            Type
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-1.5 text-xs">
            <Upload className="h-3.5 w-3.5" />
            Upload
          </TabsTrigger>
        </TabsList>

        {/* Draw tab */}
        <TabsContent value="draw" className="mt-3 space-y-3">
          {/* Pen settings */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Color:</Label>
              <div className="flex gap-1">
                {PEN_COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      penColor === color.value
                        ? 'border-emerald-500 scale-110'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setPenColor(color.value)}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Width:</Label>
              <Select value={String(penWidth)} onValueChange={(v) => setPenWidth(Number(v))}>
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PEN_WIDTHS.map((w) => (
                    <SelectItem key={w.value} value={String(w.value)}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Canvas */}
          <div className="border-2 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-inner">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              Draw your signature using mouse or touch
            </p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] gap-1"
                onClick={undoStroke}
                disabled={strokes.length === 0}
              >
                <Undo2 className="h-3 w-3" />
                Undo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] gap-1 text-destructive hover:text-destructive"
                onClick={clearCanvas}
                disabled={strokes.length === 0}
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Type tab */}
        <TabsContent value="type" className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="typed-sig" className="text-xs">Your Name</Label>
            <Input
              id="typed-sig"
              placeholder="Type your full name"
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              className="text-center"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Font Style</Label>
            <div className="grid grid-cols-2 gap-2">
              {SCRIPT_FONTS.map((font) => (
                <button
                  key={font.value}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    selectedFont === font.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                  }`}
                  onClick={() => setSelectedFont(font.value)}
                >
                  <span
                    className="text-lg text-gray-800 dark:text-gray-200"
                    style={{
                      fontFamily: font.value.includes('italic') ? 'Georgia, serif' : font.value,
                      fontStyle: font.value.includes('italic') ? 'italic' : 'normal',
                    }}
                  >
                    {typedSignature || font.label}
                  </span>
                  <p className="text-[9px] text-muted-foreground mt-1">{font.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {hasTyped && (
            <div className="border-2 border-dashed rounded-lg p-6 bg-white dark:bg-gray-800 text-center">
              <p
                className="text-3xl text-gray-800 dark:text-gray-200"
                style={{
                  fontFamily: selectedFont.includes('italic') ? 'Georgia, serif' : selectedFont,
                  fontStyle: selectedFont.includes('italic') ? 'italic' : 'normal',
                  color: penColor,
                }}
              >
                {typedSignature}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">Preview</p>
            </div>
          )}

          {/* Color picker for typed */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Ink Color:</Label>
            <div className="flex gap-1">
              {PEN_COLORS.map((color) => (
                <button
                  key={color.value}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    penColor === color.value
                      ? 'border-emerald-500 scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setPenColor(color.value)}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Upload tab */}
        <TabsContent value="upload" className="mt-3 space-y-3">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all hover:border-emerald-400 dark:hover:border-emerald-600 bg-white dark:bg-gray-800"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadedImage ? (
              <div className="space-y-3">
                <img
                  src={uploadedImage}
                  alt="Uploaded signature"
                  className="max-h-32 mx-auto object-contain"
                />
                <div className="flex items-center justify-center gap-2">
                  <ImageIcon className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">{uploadedFileName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedImage(null);
                      setUploadedFileName('');
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">Click to upload signature image</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, or SVG up to 5MB
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview section */}
      {previewSignature && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Signature Preview</Label>
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
            <img
              src={previewSignature}
              alt="Signature preview"
              className="max-h-20 mx-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handlePreview}
          disabled={
            (activeTab === 'draw' && !hasDrawn) ||
            (activeTab === 'type' && !hasTyped) ||
            (activeTab === 'upload' && !hasUploaded)
          }
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          size="sm"
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          onClick={handleApply}
          disabled={
            isSubmitting ||
            (activeTab === 'draw' && !hasDrawn) ||
            (activeTab === 'type' && !hasTyped) ||
            (activeTab === 'upload' && !hasUploaded)
          }
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {isSubmitting ? 'Signing...' : 'Apply Signature'}
        </Button>
      </div>
    </div>
  );
}
