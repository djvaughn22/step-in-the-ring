"use client";

// A site preview in a phone or desktop frame. The page inside is the exact
// file the renderer makes; nothing here changes it. It runs in a sandboxed
// frame with no scripts, so a pasted link can't do anything on this site.

import { useEffect, useRef, useState } from "react";

export type Device = "phone" | "desktop";

const SIZE: Record<Device, { w: number; h: number }> = {
  phone: { w: 390, h: 780 },
  desktop: { w: 1280, h: 820 },
};

export default function DevicePreview({
  html,
  title,
  device: controlled,
  onDevice,
  initial = "desktop",
  hideToggle = false,
}: {
  html: string;
  title: string;
  device?: Device;
  onDevice?: (d: Device) => void;
  initial?: Device;
  hideToggle?: boolean;
}) {
  const [own, setOwn] = useState<Device>(initial);
  const device = controlled ?? own;
  const setDevice = (d: Device) => (onDevice ? onDevice(d) : setOwn(d));
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = SIZE[device];
  const pad = device === "phone" ? 24 : 0;
  const scale = width ? Math.min(1, (width - pad) / w) : device === "phone" ? 0.8 : 0.5;

  return (
    <div className="dp">
      {!hideToggle && (
        <div className="dp-toggle" role="group" aria-label="Preview size">
          {(["phone", "desktop"] as const).map((d) => (
            <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)}>
              {d === "phone" ? "Phone" : "Desktop"}
            </button>
          ))}
        </div>
      )}
      <div ref={box} className={`dp-stage dp-${device}`}>
        <div className="dp-frame" style={{ width: w * scale, height: h * scale }}>
          <iframe
            title={title}
            srcDoc={html}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            style={{ width: w, height: h, transform: `scale(${scale})` }}
          />
        </div>
      </div>
    </div>
  );
}
