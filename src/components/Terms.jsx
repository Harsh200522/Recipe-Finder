import { useEffect, useState } from "react";
import "../style/terms.css";

const sections = [
  { id: "acceptance", title: "Acceptance of Terms", num: "01" },
  { id: "use-license", title: "Use License", num: "02" },
  { id: "disclaimer", title: "Disclaimer", num: "03" },
  { id: "limitations", title: "Limitations of Liability", num: "04" },
  { id: "accuracy", title: "Accuracy of Materials", num: "05" },
  { id: "materials", title: "Materials & Content", num: "06" },
  { id: "user-generated", title: "User-Generated Content", num: "07" },
  { id: "prohibited", title: "Prohibited Activities", num: "08" },
  { id: "intellectual-property", title: "Intellectual Property", num: "09" },
  { id: "third-party", title: "Third-Party Links", num: "10" },
  { id: "modifications", title: "Modifications", num: "11" },
  { id: "governing-law", title: "Governing Law", num: "12" },
  { id: "contact", title: "Contact Us", num: "13" },
];

export default function Terms() {
  const [activeSection, setActiveSection] = useState("acceptance");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      const current = sections.find((s) => {
        const el = document.getElementById(s.id);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= 120 && rect.bottom > 120;
      });
      if (current) setActiveSection(current.id);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className="terms-wrap">
        {/* HERO */}
        <header className="terms-hero">
          <p className="terms-eyebrow">Recipe Finder</p>
          <h1>Terms of Service</h1>
          <p className="terms-hero-sub">
            By using Recipe Finder, you agree to these terms. We want to ensure our
            community remains safe, respectful, and fun for everyone.
          </p>
          <span className="terms-date-badge">Last updated — March 14, 2026</span>
        </header>

        {/* BODY: SIDEBAR + CONTENT */}
        <div className="terms-body">

          {/* SIDEBAR NAV */}
          <aside className="terms-sidebar">
            <p className="terms-sidebar-label">Contents</p>
            <ul className="terms-nav">
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
          <main className="terms-content">

            {/* 01 Acceptance of Terms */}
            <section className="terms-section" id="acceptance">
              <div className="terms-section-header">
                <span className="terms-section-num">01</span>
                <h2>Acceptance of Terms</h2>
              </div>
              <p>
                Welcome to <strong>Recipe Finder</strong> ("the Platform", "we", "us", "our"). These Terms of Service ("Terms") govern your access to and use of our website, mobile application, and all features and services we provide (collectively, the "Service").
              </p>
              <p>
                By accessing, browsing, or using Recipe Finder, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to any part of these Terms, you may not use our Service.
              </p>
              <p>
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service after modifications constitutes your acceptance of the updated Terms.
              </p>
            </section>

            {/* 02 Use License */}
            <section className="terms-section" id="use-license">
              <div className="terms-section-header">
                <span className="terms-section-num">02</span>
                <h2>Use License</h2>
              </div>
              <p>
                We grant you a limited, non-exclusive, revocable license to access and use Recipe Finder for personal, non-commercial purposes. You may not:
              </p>
              <ul className="terms-list">
                <li>Modify, copy, or transmit the content of our Service without permission</li>
                <li>Use the Service for any illegal activity or violating any laws or regulations</li>
                <li>Attempt to gain unauthorized access to our systems or networks</li>
                <li>Interfere with or disrupt the normal operation of the Service</li>
                <li>Use automated tools (bots, scrapers) without explicit written permission</li>
                <li>Reverse engineer, decompile, or attempt to derive our source code</li>
                <li>Use our content for commercial purposes without a licensing agreement</li>
              </ul>
            </section>

            {/* 03 Disclaimer */}
            <section className="terms-section" id="disclaimer">
              <div className="terms-section-header">
                <span className="terms-section-num">03</span>
                <h2>Disclaimer</h2>
              </div>
              <p>
                Recipe Finder is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied. We do not warrant that:
              </p>
              <ul className="terms-list">
                <li>The Service will be uninterrupted, timely, or free from errors</li>
                <li>The quality of any products, services, or information will meet your expectations</li>
                <li>Any defects or errors will be corrected</li>
                <li>The Service is free of viruses or other harmful components</li>
              </ul>
              <div className="terms-callout warning">
                <strong>Important:</strong> We provide recipes and cooking information "as is" without warranty. Always use caution when cooking and consult with medical professionals regarding dietary concerns or allergies.
              </div>
            </section>

            {/* 04 Limitations of Liability */}
            <section className="terms-section" id="limitations">
              <div className="terms-section-header">
                <span className="terms-section-num">04</span>
                <h2>Limitations of Liability</h2>
              </div>
              <p>
                To the maximum extent permitted by law, Recipe Finder and its owners, directors, employees, and agents shall not be liable for any indirect, incidental, special, or consequential damages, including but not limited to:
              </p>
              <ul className="terms-list">
                <li>Loss of data, revenue, or profits</li>
                <li>Loss of business or business opportunity</li>
                <li>Personal injury or property damage</li>
                <li>Any damages resulting from your use or inability to use the Service</li>
              </ul>
              <p>
                Our total liability for any claim arising from these Terms shall not exceed the amount you paid us in the past 12 months, or $100, whichever is greater.
              </p>
            </section>

            {/* 05 Accuracy of Materials */}
            <section className="terms-section" id="accuracy">
              <div className="terms-section-header">
                <span className="terms-section-num">05</span>
                <h2>Accuracy of Materials</h2>
              </div>
              <p>
                While we strive to provide accurate and up-to-date information, we do not guarantee the accuracy, completeness, or timeliness of any content on Recipe Finder. Recipes, ingredient lists, cooking times, and nutritional information may vary based on:
              </p>
              <ul className="terms-list">
                <li>Ingredient quality and source</li>
                <li>Equipment and cooking methods used</li>
                <li>Individual skill level and experience</li>
                <li>Altitude, humidity, and other environmental factors</li>
              </ul>
              <p>
                Always verify ingredient measurements and cooking instructions. If you find inaccurate information, please contact us immediately through our Contact page.
              </p>
            </section>

            {/* 06 Materials & Content */}
            <section className="terms-section" id="materials">
              <div className="terms-section-header">
                <span className="terms-section-num">06</span>
                <h2>Materials & Content</h2>
              </div>
              <p>
                All content on Recipe Finder, including recipes, images, text, graphics, and design elements, is the property of Recipe Finder or its content providers and is protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                <strong>Permitted Use:</strong> You may view, print, and download content for personal, non-commercial use only. You may share recipes with friends and family with proper attribution.
              </p>
              <p>
                <strong>Prohibited Use:</strong> You may not reproduce, sell, distribute, or republish content without our express written permission. This includes:
              </p>
              <ul className="terms-list">
                <li>Publishing recipes in blogs, cookbooks, or websites without permission</li>
                <li>Using our recipes for commercial cooking or catering</li>
                <li>Scraping images or content for resale</li>
                <li>Creating derivative works from our content</li>
              </ul>
            </section>

            {/* 07 User-Generated Content */}
            <section className="terms-section" id="user-generated">
              <div className="terms-section-header">
                <span className="terms-section-num">07</span>
                <h2>User-Generated Content</h2>
              </div>
              <p>
                When you submit recipes, comments, reviews, or other content to Recipe Finder ("User Content"), you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content.
              </p>
              <p>
                You represent and warrant that:
              </p>
              <ul className="terms-list">
                <li>You own or have the right to use all User Content you submit</li>
                <li>Your content does not infringe on any third-party rights</li>
                <li>Your content is accurate, non-defamatory, and legal</li>
                <li>Your content does not violate any laws or these Terms</li>
              </ul>
              <p>
                We reserve the right to remove any User Content that violates these Terms or is offensive, inaccurate, or harmful.
              </p>
            </section>

            {/* 08 Prohibited Activities */}
            <section className="terms-section" id="prohibited">
              <div className="terms-section-header">
                <span className="terms-section-num">08</span>
                <h2>Prohibited Activities</h2>
              </div>
              <p>
                You agree not to engage in any of the following activities on Recipe Finder:
              </p>
              <ul className="terms-list">
                <li><strong>Harassment:</strong> Posting abusive, threatening, or hateful content targeting individuals or groups</li>
                <li><strong>Spam:</strong> Posting repetitive, unsolicited, or commercial advertising content</li>
                <li><strong>Misinformation:</strong> Spreading false information about recipes, health claims, or other users</li>
                <li><strong>Illegal Content:</strong> Posting content that violates laws or promotes illegal activities</li>
                <li><strong>Impersonation:</strong> Pretending to be someone else or misrepresenting your identity</li>
                <li><strong>Hacking:</strong> Attempting to gain unauthorized access to accounts or systems</li>
                <li><strong>Malware:</strong> Distributing viruses, malware, or other harmful code</li>
                <li><strong>Exploitation:</strong> Content sexualizing minors or promoting exploitation</li>
              </ul>
              <p>
                Violations will result in content removal and potential account suspension or permanent ban.
              </p>
            </section>

            {/* 09 Intellectual Property */}
            <section className="terms-section" id="intellectual-property">
              <div className="terms-section-header">
                <span className="terms-section-num">09</span>
                <h2>Intellectual Property Rights</h2>
              </div>
              <p>
                Recipe Finder respects intellectual property rights. If you believe any content on our platform infringes your copyright or intellectual property rights, please contact us with:
              </p>
              <ul className="terms-list">
                <li>A description of the infringing content</li>
                <li>Your contact information</li>
                <li>Proof of ownership or authorization</li>
                <li>A statement of good faith that the content is infringing</li>
              </ul>
              <p>
                We will investigate all claims and take appropriate action, including content removal if warranted.
              </p>
            </section>

            {/* 10 Third-Party Links */}
            <section className="terms-section" id="third-party">
              <div className="terms-section-header">
                <span className="terms-section-num">10</span>
                <h2>Third-Party Links & Services</h2>
              </div>
              <p>
                Recipe Finder may contain links to third-party websites, including Amazon for ingredient shopping and YouTube for cooking videos. We are not responsible for:
              </p>
              <ul className="terms-list">
                <li>The content, accuracy, or legality of third-party websites</li>
                <li>Any transactions or interactions with third-party services</li>
                <li>Privacy policies or terms of service of external sites</li>
                <li>Technical issues or downtime of linked services</li>
              </ul>
              <p>
                Use of third-party services is at your own risk. Always review their terms and privacy policies before engaging.
              </p>
            </section>

            {/* 11 Modifications */}
            <section className="terms-section" id="modifications">
              <div className="terms-section-header">
                <span className="terms-section-num">11</span>
                <h2>Modifications to Service</h2>
              </div>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of Recipe Finder at any time, with or without notice. This includes:
              </p>
              <ul className="terms-list">
                <li>Adding, removing, or changing features</li>
                <li>Maintaining or upgrading infrastructure</li>
                <li>Responding to legal or security issues</li>
                <li>Improving user experience and performance</li>
              </ul>
              <p>
                We will not be liable for any damages resulting from modifications to or discontinuation of the Service.
              </p>
            </section>

            {/* 12 Governing Law */}
            <section className="terms-section" id="governing-law">
              <div className="terms-section-header">
                <span className="terms-section-num">12</span>
                <h2>Governing Law & Dispute Resolution</h2>
              </div>
              <p>
                These Terms shall be governed by and construed in accordance with applicable law, without regard to conflicts of law principles.
              </p>
              <p>
                <strong>Dispute Resolution:</strong> If you have a dispute with Recipe Finder, you agree to:
              </p>
              <ul className="terms-list">
                <li>First, attempt to resolve informally by contacting our support team</li>
                <li>If unresolved after 30 days, submit a formal written complaint</li>
                <li>Participate in mediation or binding arbitration if necessary</li>
              </ul>
              <p>
                You agree not to pursue class action lawsuits against us. Any legal action must be brought individually.
              </p>
            </section>

            {/* 13 Contact */}
            <section className="terms-section" id="contact">
              <div className="terms-section-header">
                <span className="terms-section-num">13</span>
                <h2>Contact Us</h2>
              </div>
              <p>
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="terms-contact-info">
                <p><strong>Email:</strong> support@recipefinder.com</p>
                <p><strong>Contact Page:</strong> Visit our <a href="/contact">Contact Us</a> page for more options</p>
                <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
              </div>
              <div className="terms-callout">
                <strong>Thank you for being part of the Recipe Finder community!</strong> We're committed to providing a safe, welcoming, and enjoyable cooking experience for everyone.
              </div>
            </section>

          </main>
        </div>
      </div>
    </>
  );
}
