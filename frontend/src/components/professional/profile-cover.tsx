'use client';

import { useState } from 'react';
import { Palette, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SafeImage } from '@/components/ui/safe-image';
import { cn } from '@/lib/utils';
import { ProfileImageUpload } from '@/components/business/profile-image-upload';

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f5576c 0%, #ff6f91 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
];

const SOLID_COLORS = [
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#f5576c',
  '#4facfe',
  '#00f2fe',
  '#43e97b',
  '#38f9d7',
  '#fa709a',
  '#fee140',
  '#1a1a2e',
  '#16213e',
  '#0f3460',
  '#533483',
  '#e94560',
];

interface ProfileCoverProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function ProfileCover({ value, onChange, className }: ProfileCoverProps) {
  const [mode, setMode] = useState<'gradient' | 'color' | 'image' | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const hasImage = typeof value === 'string' && value.startsWith('http');
  const hasGradient = typeof value === 'string' && value.startsWith('linear');
  const hasColor = typeof value === 'string' && !value.startsWith('http') && !value.startsWith('linear') && value.length > 0;

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-40 w-full overflow-hidden rounded-xl bg-muted">
        {hasImage ? (
          <SafeImage
            src={value}
            alt="Cover"
            fill
            className="object-cover"
            sizes="100%"
          />
        ) : hasGradient || hasColor ? (
          <div
            className="h-full w-full"
            style={{ background: value }}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: GRADIENT_PRESETS[0] }}
          />
        )}

        <div className="absolute bottom-2 right-2 flex gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 gap-1 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowPicker(!showPicker)}
          >
            <Palette className="h-3.5 w-3.5" />
            Color
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 gap-1 bg-background/80 backdrop-blur-sm"
            onClick={() => setMode(mode === 'image' ? null : 'image')}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
          {(hasImage || hasGradient || hasColor) && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 bg-background/80 backdrop-blur-sm"
              onClick={() => {
                onChange(null);
                setMode(null);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {showPicker && (
        <div className="mt-3 space-y-3 rounded-xl border border-border/60 bg-card p-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Gradients</p>
            <div className="flex flex-wrap gap-2">
              {GRADIENT_PRESETS.map((gradient) => (
                <button
                  key={gradient}
                  type="button"
                  className={cn(
                    'h-8 w-8 rounded-lg border-2 transition-all hover:scale-110',
                    value === gradient ? 'border-foreground ring-2 ring-foreground/20' : 'border-transparent'
                  )}
                  style={{ background: gradient }}
                  onClick={() => {
                    onChange(gradient);
                    setMode('gradient');
                  }}
                  aria-label="Select gradient"
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Solid Colors</p>
            <div className="flex flex-wrap gap-2">
              {SOLID_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'h-8 w-8 rounded-lg border-2 transition-all hover:scale-110',
                    value === color ? 'border-foreground ring-2 ring-foreground/20' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChange(color);
                    setMode('color');
                  }}
                  aria-label="Select color"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'image' && (
        <div className="mt-3">
          <ProfileImageUpload
            value={hasImage ? value : null}
            namespace="public"
            variant="cover"
            onChange={(result) => {
              if (result?.publicUrl) {
                onChange(result.publicUrl);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

export const DEFAULT_COVER_GRADIENT = GRADIENT_PRESETS[0];
