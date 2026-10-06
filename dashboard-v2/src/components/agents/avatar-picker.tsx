"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const AVATAR_PRESETS = ["🧑‍💼", "✍️", "📈", "📣", "🛡️", "🔎", "🎨", "✅", "🤖", "🧠"];
const AVATAR_3D_PRESETS = ["businessman", "businesswoman", "creative", "analyst", "developer", "manager"];
const ACCESSORIES = ["glasses", "headset", "hat", "laptop"];

// ---- 2D avatar picker (untuk dashboard UI) ----
export function AvatarPicker({
  avatarUrl,
  color,
  displayName,
  onAvatarUrl,
  onColor,
}: {
  avatarUrl: string;
  color: string;
  displayName: string;
  onAvatarUrl: (v: string) => void;
  onColor: (v: string) => void;
}) {
  const initials = displayName.slice(0, 2).toUpperCase() || "AG";
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full grid place-items-center text-2xl"
          style={{ backgroundColor: color + "33", border: `2px solid ${color}` }}
        >
          {avatarUrl || initials}
        </div>
        <input type="color" value={color} onChange={(e) => onColor(e.target.value)} />
      </div>
      <div>
        <Label>Preset icon</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {AVATAR_PRESETS.map((e) => (
            <button
              key={e}
              type="button"
              className={`text-xl rounded border px-1 ${avatarUrl === e ? "border-primary" : "border-transparent"}`}
              onClick={() => onAvatarUrl(avatarUrl === e ? "" : e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="avatar-url">URL gambar (opsional)</Label>
        <Input
          id="avatar-url"
          placeholder="https://... atau /avatars/nama.png"
          value={avatarUrl.startsWith("http") || avatarUrl.startsWith("/") ? avatarUrl : ""}
          onChange={(e) => onAvatarUrl(e.target.value)}
        />
      </div>
    </div>
  );
}

// ---- 3D avatar config (untuk kantor-agent plugin) ----
export function Avatar3DEditor({
  value,
  onChange,
  color,
}: {
  value: string;
  onChange: (json: string) => void;
  color: string;
}) {
  let parsed: { model?: string; accessories?: string[]; scale?: number } = {};
  try {
    parsed = value ? JSON.parse(value) : {};
  } catch {
    parsed = {};
  }
  const [model, setModel] = useState(parsed.model || "businessman");
  const [accessories, setAccessories] = useState<string[]>(parsed.accessories || []);
  const [scale, setScale] = useState(parsed.scale || 1.0);

  function emit(m: string, a: string[], s: number) {
    onChange(JSON.stringify({ model: m, color, accessories: a, scale: s }));
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Model 3D</Label>
        <Select value={model} onValueChange={(v) => { const m = v ?? "businessman"; setModel(m); emit(m, accessories, scale); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {AVATAR_3D_PRESETS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Aksesoris</Label>
        <div className="flex flex-wrap gap-3 mt-1">
          {ACCESSORIES.map((a) => (
            <label key={a} className="flex items-center gap-1 text-sm">
              <Checkbox
                checked={accessories.includes(a)}
                onCheckedChange={(c) => {
                  const next = c === true ? [...accessories, a] : accessories.filter((x) => x !== a);
                  setAccessories(next);
                  emit(model, next, scale);
                }}
              />
              {a}
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="avatar-scale">Scale ({scale.toFixed(1)})</Label>
        <input
          id="avatar-scale"
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={scale}
          className="w-full"
          onChange={(e) => { const s = Number(e.target.value); setScale(s); emit(model, accessories, s); }}
        />
      </div>
      <div>
        <Label>JSON tersimpan</Label>
        <Textarea value={value} readOnly rows={3} className="font-mono text-xs" />
      </div>
    </div>
  );
}
