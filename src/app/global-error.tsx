"use client";

// Replaces the root layout when it fails, so it brings its own <html> and
// styles (nothing from globals.css reaches it).
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  console.error(error);
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#031322",
          color: "#f3eefc",
          fontFamily: "Georgia, serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <title>Something went wrong · TODOctopus</title>
          <h1>Something went wrong</h1>
          <p>Your tasks are safe. Please try again.</p>
          <button
            onClick={() => retry()}
            style={{
              marginTop: 16,
              padding: "10px 24px",
              fontSize: 18,
              color: "#fff",
              border: 0,
              borderRadius: 999,
              background: "linear-gradient(135deg, #ff00c2, #ff4d00)",
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
