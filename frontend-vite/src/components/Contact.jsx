export default function Contact() {
  return (
    <section className="page card glass" id="contact">
      <div className="section-box glass">
        <h2 className="section-title">Contact & Feedback</h2>
        <p
          style={{
            color: "var(--white-muted)",
            marginBottom: 18,
            maxWidth: 820,
            lineHeight: 1.7,
          }}
        >
          If you want to suggest improvements or report an issue, please use the
          form below or reach out directly to:
        </p>
        <div
          className="feedback-details"
          style={{
            display: "grid",
            gap: "18px",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          <div
            style={{
              padding: 22,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
            }}
          >
            <h3 style={{ marginBottom: 10, color: "var(--gold-300)" }}>
              Contact Me Directly
            </h3>
            <p style={{ marginBottom: 6, fontSize: "1rem" }}>
              Phone: <strong>08119919481</strong>
            </p>
            <p style={{ fontSize: "1rem" }}>
              Email:{" "}
              <a
                href="mailto:akoredelekan444@gmail.com"
                style={{ color: "var(--gold-300)", textDecoration: "none" }}
              >
                akoredelekan444@gmail.com
              </a>
            </p>
          </div>
          <div
            style={{
              padding: 22,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
            }}
          >
            <h3 style={{ marginBottom: 10, color: "var(--gold-300)" }}>
              Send Feedback
            </h3>
            <form
              action="https://formspree.io/f/xojpwvbw"
              method="POST"
              style={{ display: "grid", gap: "14px" }}
            >
              <label
                style={{ fontSize: ".95rem", color: "var(--white-muted)" }}
              >
                Name (optional)
              </label>
              <input
                type="text"
                name="from_name"
                placeholder="Your name"
                autoComplete="name"
              />
              <label
                style={{ fontSize: ".95rem", color: "var(--white-muted)" }}
              >
                Email (optional)
              </label>
              <input
                type="email"
                name="email"
                placeholder="Your email"
                autoComplete="email"
              />
              <label
                style={{ fontSize: ".95rem", color: "var(--white-muted)" }}
              >
                Message
              </label>
              <textarea
                name="message"
                rows={6}
                placeholder="Write your feedback here..."
              />
              <input
                type="hidden"
                name="_subject"
                value="Deen Guide feedback"
              />
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <button type="submit" className="secondary">
                  Send Feedback
                </button>
                <span
                  style={{ color: "var(--white-muted)", fontSize: ".95rem" }}
                >
                  Your message will be sent securely, or opened in your email
                  app.
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
