"use client";

/**
 * The last line of defence: catches an error thrown by the root layout
 * itself (a font failing to load, `site` data malformed, JSON-LD blowing up),
 * which `error.tsx` cannot — that boundary only wraps what the layout renders,
 * not the layout. Because it replaces the root layout when it fires, it has
 * to define its own `<html>` and `<body>`, and it deliberately does not import
 * global styles or the site chrome, either of which could be the thing that
 * failed. Kept to inline styles so it has nothing left to fail on.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1f130d",
          color: "#f6efe2",
          fontFamily: "Georgia, serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <p style={{ fontSize: 12, letterSpacing: "0.28em", textTransform: "uppercase", color: "#e2bd6c", margin: 0 }}>
            Something went wrong
          </p>
          <h1 style={{ fontWeight: 400, fontSize: 28, margin: "16px 0 0" }}>The kitchen hit a snag.</h1>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 28,
              padding: "12px 28px",
              borderRadius: 999,
              border: "1px solid rgba(226,189,108,.5)",
              background: "transparent",
              color: "#f6efe2",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
