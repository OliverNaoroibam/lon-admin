'use client';

/**
 * ImageCropUploader
 * -----------------
 * A reusable image upload + crop modal component for the LON Admin Panel.
 *
 * Features:
 * - Drag-and-drop or click-to-browse file selection
 * - Full crop UI (react-easy-crop) with the correct aspect ratio per image type
 * - Zoom slider
 * - Canvas-based crop output → base64 data URL → caller receives a cropped blob/dataURL
 * - Preset configs for every image type used across LON admin (banners, logos, categories, etc.)
 * - Shows a live preview of the cropped result before confirming
 *
 * Usage:
 *   <ImageCropUploader
 *     preset="hero_banner"        // controls aspect ratio + label
 *     onCropped={(dataUrl) => { ... upload to Supabase storage ... }}
 *     onCancel={() => setShowCrop(false)}
 *   />
 */

import { useCallback, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { Upload, ZoomIn, ZoomOut, RotateCw, Check, X, ImageIcon } from 'lucide-react';

// ─── Preset Definitions ──────────────────────────────────────────────────────
export type CropPreset =
  | 'hero_banner'        // 16:5  — home screen hero carousel (1600×500)
  | 'mid_banner'         // 16:6  — mid-section banner (1600×600)
  | 'festival_banner'    // 21:9  — wide cinematic festival (2100×900)
  | 'category_tile'      // 1:1   — square category grid tile
  | 'seller_logo'        // 1:1   — round seller store logo
  | 'seller_cover'       // 4:1   — wide seller storefront cover banner
  | 'product_image'      // 3:4   — portrait product photo
  | 'campaign_banner'    // 16:5  — same as hero
  | 'profile_photo'      // 1:1   — user profile photo
  | 'onboarding_slide'   // 9:16  — full-screen mobile onboarding slide
  | 'policy_cover'       // 3:1   — policy document header
  | 'custom';            // free crop (no fixed ratio)

interface PresetConfig {
  label: string;
  aspect: number;
  outputWidth: number;
  outputHeight: number;
  hint: string;
}

export const CROP_PRESETS: Record<CropPreset, PresetConfig> = {
  hero_banner: {
    label: 'Hero Banner',
    aspect: 16 / 5,
    outputWidth: 1600,
    outputHeight: 500,
    hint: '1600 × 500 px — Home screen carousel',
  },
  mid_banner: {
    label: 'Mid Banner',
    aspect: 16 / 6,
    outputWidth: 1600,
    outputHeight: 600,
    hint: '1600 × 600 px — Mid section placement',
  },
  festival_banner: {
    label: 'Festival Banner',
    aspect: 21 / 9,
    outputWidth: 2100,
    outputHeight: 900,
    hint: '2100 × 900 px — Festival campaign hero',
  },
  category_tile: {
    label: 'Category Tile',
    aspect: 1,
    outputWidth: 600,
    outputHeight: 600,
    hint: '600 × 600 px — Square category grid image',
  },
  seller_logo: {
    label: 'Seller Logo',
    aspect: 1,
    outputWidth: 400,
    outputHeight: 400,
    hint: '400 × 400 px — Circular seller store logo',
  },
  seller_cover: {
    label: 'Seller Cover',
    aspect: 4 / 1,
    outputWidth: 1600,
    outputHeight: 400,
    hint: '1600 × 400 px — Seller storefront cover banner',
  },
  product_image: {
    label: 'Product Photo',
    aspect: 3 / 4,
    outputWidth: 900,
    outputHeight: 1200,
    hint: '900 × 1200 px — Portrait product listing photo',
  },
  campaign_banner: {
    label: 'Campaign Banner',
    aspect: 16 / 5,
    outputWidth: 1600,
    outputHeight: 500,
    hint: '1600 × 500 px — Festival campaign hero card',
  },
  profile_photo: {
    label: 'Profile Photo',
    aspect: 1,
    outputWidth: 400,
    outputHeight: 400,
    hint: '400 × 400 px — User or admin profile picture',
  },
  onboarding_slide: {
    label: 'Onboarding Slide',
    aspect: 9 / 16,
    outputWidth: 1080,
    outputHeight: 1920,
    hint: '1080 × 1920 px — Full-screen mobile onboarding',
  },
  policy_cover: {
    label: 'Policy Cover',
    aspect: 3 / 1,
    outputWidth: 1200,
    outputHeight: 400,
    hint: '1200 × 400 px — Policy document header image',
  },
  custom: {
    label: 'Free Crop',
    aspect: NaN, // free ratio
    outputWidth: 1200,
    outputHeight: 800,
    hint: 'No fixed ratio — drag freely to crop',
  },
};

// ─── Canvas Crop Helper ───────────────────────────────────────────────────────
async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth: number,
  outputHeight: number,
  rotation = 0
): Promise<string> {
  const img = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;

  // Apply rotation if needed
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  ctx.drawImage(
    img,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    outputWidth,
    outputHeight
  );
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Component Props ──────────────────────────────────────────────────────────
interface ImageCropUploaderProps {
  preset: CropPreset;
  onCropped: (dataUrl: string) => void;
  onCancel: () => void;
  /** Optional: show preset selector so admin can override the ratio */
  allowPresetChange?: boolean;
  /** Label shown in the drop zone (defaults to preset label) */
  label?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ImageCropUploader({
  preset: initialPreset,
  onCropped,
  onCancel,
  allowPresetChange = false,
  label,
}: ImageCropUploaderProps) {
  const [preset, setPreset] = useState<CropPreset>(initialPreset);
  const config = CROP_PRESETS[preset];

  // Step 1 = file selection, Step 2 = crop, Step 3 = preview/confirm
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── File handling ──────────────────────────────────────────────────────────
  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setStep(2);
    };
    reader.readAsDataURL(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  // ── Crop complete callback ─────────────────────────────────────────────────
  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // ── Show preview ──────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const dataUrl = await getCroppedImageBlob(
      imageSrc,
      croppedAreaPixels,
      config.outputWidth,
      config.outputHeight,
      rotation
    );
    setCroppedPreview(dataUrl);
    setStep(3);
  };

  // ── Confirm crop ──────────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (croppedPreview) onCropped(croppedPreview);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-border w-full max-w-2xl mx-4 overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-text-primary">
              {label ?? config.label} — Upload &amp; Crop
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5">{config.hint}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Preset switcher */}
            {allowPresetChange && (
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value as CropPreset)}
                className="text-xs px-3 py-1.5 bg-bg border border-border rounded-lg focus:outline-none focus:border-gold"
              >
                {(Object.keys(CROP_PRESETS) as CropPreset[]).map((k) => (
                  <option key={k} value={k}>{CROP_PRESETS[k].label}</option>
                ))}
              </select>
            )}
            <button onClick={onCancel} className="p-2 rounded-lg hover:bg-bg transition-colors">
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0 px-6 pt-4 pb-2">
          {(['Select', 'Crop', 'Confirm'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-0">
              <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                step === i + 1 ? 'text-gold' : step > i + 1 ? 'text-success' : 'text-text-tertiary'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                  step === i + 1 ? 'border-gold bg-gold/10 text-gold'
                  : step > i + 1 ? 'border-success bg-success/10 text-success'
                  : 'border-border bg-bg text-text-tertiary'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                {s}
              </div>
              {i < 2 && <div className="w-8 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: File Select ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="p-6">
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-gold bg-gold/5 scale-[1.01]'
                  : 'border-border hover:border-gold/50 hover:bg-bg/50'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${
                isDragging ? 'bg-gold/10' : 'bg-bg'
              }`}>
                <Upload className={`w-6 h-6 transition-colors ${isDragging ? 'text-gold' : 'text-text-tertiary'}`} />
              </div>
              <p className="font-medium text-text-primary mb-1">
                {isDragging ? 'Drop to upload' : 'Click or drag image here'}
              </p>
              <p className="text-xs text-text-tertiary">
                PNG, JPG, WEBP — Will be cropped to {config.outputWidth}×{config.outputHeight}px
              </p>

              {/* Aspect ratio badge */}
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gold/5 border border-gold/20 rounded-full">
                <ImageIcon className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs text-gold font-medium">
                  {isNaN(config.aspect)
                    ? 'Free crop'
                    : `${config.outputWidth}:${config.outputHeight} aspect ratio`}
                </span>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        )}

        {/* ── STEP 2: Crop ─────────────────────────────────────────────────── */}
        {step === 2 && imageSrc && (
          <div>
            {/* Crop area */}
            <div className="relative bg-[#111] overflow-hidden" style={{ height: 340 }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={isNaN(config.aspect) ? undefined : config.aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: { borderRadius: 0 },
                  cropAreaStyle: {
                    border: '2px solid rgba(196, 148, 61, 0.9)',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                  },
                }}
              />
            </div>

            {/* Controls */}
            <div className="p-5 space-y-4 border-t border-border">
              {/* Zoom */}
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-gold h-1.5 cursor-pointer"
                />
                <ZoomIn className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                <span className="text-xs text-text-tertiary w-10 text-right">
                  {zoom.toFixed(1)}×
                </span>
              </div>

              {/* Rotation */}
              <div className="flex items-center gap-3">
                <RotateCw className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 accent-gold h-1.5 cursor-pointer"
                />
                <button
                  onClick={() => setRotation(0)}
                  className="text-xs text-text-tertiary hover:text-gold transition-colors w-10 text-right"
                >
                  {rotation}°
                </button>
              </div>

              {/* Rotation quick buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-tertiary">Quick rotate:</span>
                {[-90, -45, 0, 45, 90].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => setRotation(deg)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                      rotation === deg ? 'bg-gold/10 text-gold ring-1 ring-gold/30' : 'bg-bg text-text-secondary hover:bg-border'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-5 pb-5 gap-3">
              <button
                onClick={() => { setStep(1); setImageSrc(null); }}
                className="px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg transition-colors"
              >
                ← Change photo
              </button>
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl text-sm font-semibold hover:bg-gold-dark transition-colors"
              >
                Preview crop →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirm Preview ───────────────────────────────────────── */}
        {step === 3 && croppedPreview && (
          <div>
            <div className="p-5">
              <p className="text-xs text-text-secondary mb-3 font-medium uppercase tracking-wider">
                Cropped preview — {config.outputWidth}×{config.outputHeight}px
              </p>
              <div className="rounded-xl overflow-hidden border border-border bg-[#111] flex items-center justify-center" style={{ maxHeight: 320 }}>
                <img
                  src={croppedPreview}
                  alt="Cropped preview"
                  className="object-contain w-full"
                  style={{ maxHeight: 320 }}
                />
              </div>
              <p className="text-xs text-text-tertiary mt-2">
                This is exactly what will be saved. Tap "Use this image" to confirm or go back to re-crop.
              </p>
            </div>

            <div className="flex items-center justify-between px-5 pb-5 gap-3 border-t border-border pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg transition-colors"
              >
                ← Re-crop
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="px-4 py-2.5 rounded-xl text-sm text-error hover:bg-error/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-2 px-5 py-2.5 bg-success text-white rounded-xl text-sm font-semibold hover:bg-success/90 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Use this image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
