export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center surface-gold pt-32" aria-busy="true" aria-live="polite">
      <span className="eyebrow animate-pulse text-gold-light">Setting the table</span>
    </div>
  );
}
