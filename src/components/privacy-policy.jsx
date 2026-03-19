import { useEffect, useState } from "react";
import "../style/privacy.css";
const sections = [
  { id: "introduction", title: "Introduction", num: "01" },
  { id: "information-we-collect", title: "Information We Collect", num: "02" },
  { id: "how-we-use-information", title: "How We Use It", num: "03" },
  { id: "cookies", title: "Cookies & Tracking", num: "04" },
  { id: "third-party-services", title: "Third-Party Services", num: "05" },
  { id: "data-protection", title: "Data Protection", num: "06" },
  { id: "data-sharing", title: "Data Sharing", num: "07" },
  { id: "your-rights", title: "Your Rights", num: "08" },
  { id: "retention", title: "Data Retention", num: "09" },
  { id: "children", title: "Children's Privacy", num: "10" },
  { id: "changes", title: "Policy Changes", num: "11" },
  { id: "contact", title: "Contact Us", num: "12" },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("introduction");
const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  setActiveSection(id); // set immediately on click, don't wait for observer
};

useEffect(() => {
  const isMobile = window.innerWidth < 860;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    },
    {
      rootMargin: isMobile ? "-5% 0px -60% 0px" : "-20% 0px -75% 0px",
      threshold: 0,
    }
  );

  sections.forEach((s) => {
    const el = document.getElementById(s.id);
    if (el) observer.observe(el);
  });

  return () => observer.disconnect();
}, []);
  return (
    <>


      <div className="pp-wrap">
        {/* HERO */}
        <header className="pp-hero">
          <p className="pp-eyebrow">Recipe Finder</p>
          <h1>Privacy Policy</h1>
          <p className="pp-hero-sub">
            We believe transparency builds trust. Here's exactly what data we
            collect, why we collect it, and how you stay in control.
          </p>
          <span className="pp-date-badge">Last updated — March 12, 2026</span>
        </header>

        {/* BODY: SIDEBAR + CONTENT */}
        <div className="pp-body">

          {/* SIDEBAR NAV */}
          <aside className="pp-sidebar">
            <p className="pp-sidebar-label">Contents</p>
            <ul className="pp-nav">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    className={activeSection === s.id ? "active" : ""}
                    onClick={() => scrollTo(s.id)}
                  >
                    <span className="nav-num">{s.num}</span>
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* MAIN CONTENT */}
          <main className="pp-content">

            {/* 01 Introduction */}
            <section className="pp-section" id="introduction">
              <div className="pp-section-header">
                <span className="pp-section-num">01</span>
                <h2>Introduction</h2>
              </div>
              <p>
                Welcome to <strong>Recipe Finder</strong> — a platform built for home cooks,
                food explorers, and kitchen adventurers. Our mission is to make discovering
                great recipes simple, fast, and personal.
              </p>
              <p>
                This Privacy Policy describes how we collect, use, store, and share your
                information when you visit our website or use any of our services. By using
                Recipe Finder, you agree to the practices described in this policy.
              </p>
              <div className="pp-callout">
                <strong>Short version:</strong> We collect only what we need to make the
                app work well for you. We never sell your data. You can ask us to delete
                your information at any time.
              </div>
            </section>

            {/* 02 Information We Collect */}
            <section className="pp-section" id="information-we-collect">
              <div className="pp-section-header">
                <span className="pp-section-num">02</span>
                <h2>Information We Collect</h2>
              </div>
              <p>
                We collect information to provide and improve our services. The types of
                data we collect fall into three categories:
              </p>
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Examples</th>
                    <th>How It's Collected</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Usage Data</strong></td>
                    <td>Pages visited, search queries, recipe views, time spent</td>
                    <td>Automatically, via cookies and analytics</td>
                  </tr>
                  <tr>
                    <td><strong>Device & Browser</strong></td>
                    <td>Browser type, OS, screen resolution, language</td>
                    <td>Automatically when you visit</td>
                  </tr>
                  <tr>
                    <td><strong>Account Data</strong></td>
                    <td>Name, email, saved recipes, dietary preferences</td>
                    <td>Provided by you when registering</td>
                  </tr>
                  <tr>
                    <td><strong>Communications</strong></td>
                    <td>Messages you send us, feedback, support requests</td>
                    <td>Provided by you directly</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* 03 How We Use Information */}
            <section className="pp-section" id="how-we-use-information">
              <div className="pp-section-header">
                <span className="pp-section-num">03</span>
                <h2>How We Use Information</h2>
              </div>
              <p>The data we collect is used strictly for the following purposes:</p>
              <ul className="pp-list">
                <li>Personalise recipe recommendations based on your preferences and past searches</li>
                <li>Improve the search algorithm and surface better results over time</li>
                <li>Monitor and fix bugs, errors, and performance issues on the platform</li>
                <li>Analyse website traffic and usage patterns to guide product decisions</li>
                <li>Send account-related notifications (password reset, policy updates)</li>
                <li>Respond to your support inquiries and feedback</li>
                <li>Detect and prevent fraudulent or abusive behaviour</li>
              </ul>
              <div className="pp-callout-sage">
                <strong>We will never:</strong> sell your personal data, use it for political
                targeting, or share it with advertisers for behavioural profiling.
              </div>
            </section>

            {/* 04 Cookies */}
            <section className="pp-section" id="cookies">
              <div className="pp-section-header">
                <span className="pp-section-num">04</span>
                <h2>Cookies &amp; Tracking</h2>
              </div>
              <p>
                We use cookies — small text files stored in your browser — to enhance your
                experience and understand how our service is used.
              </p>
              <ul className="pp-list">
                <li><strong>Essential cookies:</strong> Required for the website to function (login sessions, preferences)</li>
                <li><strong>Analytics cookies:</strong> Help us understand traffic patterns using tools like Google Analytics</li>
                <li><strong>Functional cookies:</strong> Remember your saved filters, dietary restrictions, and display settings</li>
                <li><strong>Advertising cookies:</strong> Used by services like Google AdSense to show relevant ads</li>
              </ul>
              <p>
                You can control or disable cookies through your browser settings at any time.
                Note that disabling certain cookies may affect the functionality of the app.
              </p>
            </section>

            {/* 05 Third-Party Services */}
            <section className="pp-section" id="third-party-services">
              <div className="pp-section-header">
                <span className="pp-section-num">05</span>
                <h2>Third-Party Services</h2>
              </div>
              <p>
                Recipe Finder integrates with trusted third-party providers to operate and
                improve the platform. Each service has its own privacy policy governing
                how they handle data.
              </p>
              <ul className="pp-list">
                <li><strong>Google Analytics</strong> — Website traffic and usage analytics</li>
                <li><strong>Google AdSense</strong> — Contextual advertising to support the platform</li>
                <li><strong>Cloudflare</strong> — Security, CDN, and performance optimisation</li>
                <li><strong>Sendgrid / Mailchimp</strong> — Transactional and marketing emails (opt-in only)</li>
                <li><strong>Stripe</strong> — Payment processing for any premium features (never stores card data on our servers)</li>
              </ul>
              <p>
                We carefully vet third-party partners and share only the minimum data
                necessary for them to perform their services.
              </p>
            </section>

            {/* 06 Data Protection */}
            <section className="pp-section" id="data-protection">
              <div className="pp-section-header">
                <span className="pp-section-num">06</span>
                <h2>Data Protection</h2>
              </div>
              <p>
                Protecting your information is a core responsibility we take seriously.
                We implement industry-standard technical and organisational measures to
                safeguard your data.
              </p>
              <ul className="pp-list">
                <li>All data is transmitted over encrypted HTTPS connections (TLS 1.2+)</li>
                <li>Passwords are hashed using bcrypt — never stored in plain text</li>
                <li>Databases are access-controlled and regularly audited</li>
                <li>Our team undergoes regular security and privacy training</li>
                <li>We conduct periodic vulnerability assessments and penetration tests</li>
              </ul>
              <div className="pp-callout">
                If we ever detect a data breach that may affect you, we will notify you
                within <strong>72 hours</strong> in accordance with applicable data
                protection laws.
              </div>
            </section>

            {/* 07 Data Sharing */}
            <section className="pp-section" id="data-sharing">
              <div className="pp-section-header">
                <span className="pp-section-num">07</span>
                <h2>Data Sharing</h2>
              </div>
              <p>
                We do not sell, rent, or trade your personal information. We may share data
                only in the following limited circumstances:
              </p>
              <ul className="pp-list">
                <li><strong>Service providers:</strong> Trusted partners who help us operate Recipe Finder (see §05)</li>
                <li><strong>Legal obligations:</strong> When required by law, court order, or government authority</li>
                <li><strong>Business transfer:</strong> In the event of a merger, acquisition, or sale of assets — you will be notified</li>
                <li><strong>Safety:</strong> To protect the rights, property, or safety of our users or the public</li>
              </ul>
            </section>

            {/* 08 Your Rights */}
            <section className="pp-section" id="your-rights">
              <div className="pp-section-header">
                <span className="pp-section-num">08</span>
                <h2>Your Rights</h2>
              </div>
              <p>
                Depending on your location, you may have rights under GDPR, CCPA, or other
                applicable privacy laws. We honour all of the following:
              </p>
              <div className="rights-grid">
                <div className="rights-card">
                  <div className="rights-card-icon">👁️</div>
                  <h4>Access</h4>
                  <p>Request a copy of the personal data we hold about you</p>
                </div>
                <div className="rights-card">
                  <div className="rights-card-icon">✏️</div>
                  <h4>Rectification</h4>
                  <p>Ask us to correct inaccurate or incomplete data</p>
                </div>
                <div className="rights-card">
                  <div className="rights-card-icon">🗑️</div>
                  <h4>Erasure</h4>
                  <p>Request deletion of your personal data ("right to be forgotten")</p>
                </div>
                <div className="rights-card">
                  <div className="rights-card-icon">🚫</div>
                  <h4>Restriction</h4>
                  <p>Ask us to limit how we process your data</p>
                </div>
                <div className="rights-card">
                  <div className="rights-card-icon">📦</div>
                  <h4>Portability</h4>
                  <p>Receive your data in a structured, machine-readable format</p>
                </div>
                <div className="rights-card">
                  <div className="rights-card-icon">✋</div>
                  <h4>Objection</h4>
                  <p>Object to processing based on legitimate interests or marketing</p>
                </div>
              </div>
              <p style={{ marginTop: "20px" }}>
                To exercise any of these rights, contact us at{" "}
                <a href="mailto:privacy@recipefinder.com" style={{ color: "var(--spice)" }}>
                  privacy@recipefinder.com
                </a>. We will respond within <strong>30 days</strong>.
              </p>
            </section>

            {/* 09 Data Retention */}
            <section className="pp-section" id="retention">
              <div className="pp-section-header">
                <span className="pp-section-num">09</span>
                <h2>Data Retention</h2>
              </div>
              <p>
                We retain your personal data only for as long as necessary to provide our
                services and comply with legal obligations.
              </p>
              <ul className="pp-list">
                <li><strong>Account data:</strong> Retained while your account is active; deleted within 30 days of account closure</li>
                <li><strong>Usage and analytics data:</strong> Aggregated and anonymised after 26 months</li>
                <li><strong>Communications:</strong> Retained for up to 2 years for quality and legal purposes</li>
                <li><strong>Backup copies:</strong> May persist for up to 90 days in encrypted backups before full deletion</li>
              </ul>
            </section>

            {/* 10 Children */}
            <section className="pp-section" id="children">
              <div className="pp-section-header">
                <span className="pp-section-num">10</span>
                <h2>Children's Privacy</h2>
              </div>
              <p>
                Recipe Finder is not directed at children under the age of 13. We do not
                knowingly collect personal information from children. If you believe a child
                has provided us with their data without parental consent, please contact us
                immediately and we will delete the information promptly.
              </p>
              <p>
                If you are between 13 and 18 years of age, please ensure a parent or
                guardian has reviewed and agreed to this Privacy Policy before using
                our services.
              </p>
            </section>

            {/* 11 Changes */}
            <section className="pp-section" id="changes">
              <div className="pp-section-header">
                <span className="pp-section-num">11</span>
                <h2>Policy Changes</h2>
              </div>
              <p>
                We may update this Privacy Policy periodically to reflect changes in our
                practices, technology, or legal requirements. When we make significant
                changes, we will:
              </p>
              <ul className="pp-list">
                <li>Update the "Last updated" date at the top of this page</li>
                <li>Send a notification email to registered users at least 14 days before changes take effect</li>
                <li>Display a prominent notice on the website</li>
              </ul>
              <p>
                Your continued use of Recipe Finder after any changes constitutes your
                acceptance of the updated policy. We encourage you to review this page
                regularly.
              </p>
            </section>

            {/* 12 Contact */}
            <section className="pp-section" id="contact">
              <div className="pp-section-header">
                <span className="pp-section-num">12</span>
                <h2>Contact Us</h2>
              </div>
              <p>
                Have questions about this policy or want to exercise your privacy rights?
                Our dedicated privacy team is here to help.
              </p>
              <div className="contact-card">
                <h3>🍳 Recipe Finder Privacy Team</h3>
                <p>We aim to respond to all privacy-related inquiries within 2 business days.</p>
                <div className="contact-links">
                  <a href="mailto:infolivesta@gmail.com" className="contact-link">
                    ✉️ infolivesta@gmail.com
                  </a>
                </div>
              </div>
            </section>

          </main>
        </div>

      </div>
    </>
  );
}
