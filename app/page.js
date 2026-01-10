"use client"
import Image from "next/image";


export default function Page() {
  return (
    <main style={styles.body}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.logo}>RITUAL</div>
        <div style={styles.links}>
          <a style={styles.link}>Docs</a>
          <a style={styles.link}>Blog</a>
          <a style={styles.link}>Community</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <h1 style={styles.h1}>Verifiable AI Infrastructure</h1>
        <p style={styles.p}>
          Ritual is building trustless AI inference by combining cryptography,
          decentralization, and open systems.
        </p>

        <div style={styles.buttons}>
          <button style={styles.primary}>Get Started</button>
          <button style={styles.secondary}>Read Docs</button>
        </div>
      </section>

      {/* Sections */}
      <section style={styles.section}>
        <h2 style={styles.h2}>Why Ritual</h2>
        <p style={styles.pMuted}>
          Frontier AI needs stronger guarantees. Ritual makes inference
          verifiable, reproducible, and transparent by default.
        </p>
      </section>

      <section style={{ ...styles.section, background: "#111" }}>
        <h2 style={styles.h2}>Built for What Comes Next</h2>
        <p style={styles.pMuted}>
          Designed for developers, researchers, and protocols that care about
          correctness, not hype.
        </p>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        © {new Date().getFullYear()} Ritual
      </footer>
    </main>
  );
}

const styles = {
  body: {
    fontFamily: "Inter, system-ui, sans-serif",
    background: "#0b0b0e",
    color: "#fff",
    minHeight: "100vh",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "20px 40px",
  },
  logo: {
    fontWeight: 700,
    letterSpacing: "2px",
  },
  links: {
    display: "flex",
    gap: "24px",
  },
  link: {
    color: "#aaa",
    textDecoration: "none",
    cursor: "pointer",
  },
  hero: {
    minHeight: "80vh",
    padding: "80px 40px",
    maxWidth: "900px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  h1: {
    fontSize: "3.5rem",
    marginBottom: "20px",
  },
  h2: {
    fontSize: "2rem",
    marginBottom: "16px",
  },
  p: {
    fontSize: "1.2rem",
    color: "#ccc",
    maxWidth: "600px",
  },
  pMuted: {
    fontSize: "1.1rem",
    color: "#bbb",
    maxWidth: "600px",
  },
  buttons: {
    marginTop: "30px",
    display: "flex",
    gap: "12px",
  },
  primary: {
    padding: "12px 24px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    background: "#fff",
    color: "#000",
    fontSize: "1rem",
  },
  secondary: {
    padding: "12px 24px",
    borderRadius: "6px",
    border: "1px solid #444",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontSize: "1rem",
  },
  section: {
    padding: "80px 40px",
    maxWidth: "900px",
  },
  footer: {
    padding: "40px",
    textAlign: "center",
    color: "#666",
  },
};
