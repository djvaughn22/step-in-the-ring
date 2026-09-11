/** Small, cohesive line icons for actions, distinct from the product mark. */
export default function WorkshopIcon({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {kind === "create" ? <path d="m5 16-1 4 4-1L20 7l-3-3ZM14 7l3 3" /> : kind === "solve" ? <><circle cx="5" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9" /></> : <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18m-11 4-3 2 3 2m4-4 3 2-3 2" /></>}
    </svg>
  );
}
