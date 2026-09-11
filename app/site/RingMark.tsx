import Image from "next/image";

/** Official mark. All placements use this asset; adjacent text names the brand. */
export default function RingMark() {
  return <Image className="ring-mark-icon" src="/icons/ring-mark.svg" width={64} height={64} alt="" aria-hidden="true" unoptimized />;
}
