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
  const scale = Math.min(1, (width - pad) / w);
  // Until the stage is measured (the server render, and a slow load before the
  // page hydrates) CSS sizes the frame to the same box: the stage width less
  // the pad, never wider than the device. So it already fits and nothing moves
  // or overlaps while loading. The page inside needs that width for its scale,
  // so it stays hidden until then.
  const frame = width
    ? { width: w * scale, height: h * scale }
    : { width: `min(${w}px, 100% - ${pad}px)`, aspectRatio: `${w} / ${h}` };
  const page = width
    ? { width: w, height: h, transform: `scale(${scale})` }
    : { width: w, height: h, visibility: "hidden" as const };

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
        <div className="dp-frame" style={frame}>
          <iframe
            title={title}
            srcDoc={html}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            style={page}
          />
        </div>
      </div>
    </div>
  );
}
