export default function TermsPage() {
  return (
    <div style={{
      maxWidth:   760,
      margin:     "0 auto",
      padding:    "60px 24px",
      fontFamily: "'Inter', sans-serif",
      color:      "#1a2744",
      lineHeight: 1.7,
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Terms of Service
      </h1>
      <p style={{ color: "#7a94b0", fontSize: 14, marginBottom: 40 }}>
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      {[
        {
          title: "1. Acceptance of Terms",
          body:  "By using MailMind, you agree to these Terms of Service. If you do not agree, please do not use the service.",
        },
        {
          title: "2. Description of Service",
          body:  "MailMind is an AI-powered email assistant that connects to your Gmail account to triage emails and generate reply drafts. The service is provided as-is.",
        },
        {
          title: "3. Google Account Access",
          body:  "MailMind requires access to your Google account and Gmail. You authorize us to access your Gmail data solely to provide the service features. You can revoke this access at any time.",
        },
        {
          title: "4. Acceptable Use",
          body:  "You agree not to use MailMind for any unlawful purpose, to send spam or unsolicited emails, to violate any third party's rights, or to attempt to gain unauthorized access to our systems.",
        },
        {
          title: "5. AI-Generated Content",
          body:  "MailMind uses AI to generate email reply drafts. These drafts are suggestions only. You are responsible for reviewing and approving any content before sending. We are not responsible for any emails sent using our service.",
        },
        {
          title: "6. Limitation of Liability",
          body:  "MailMind is provided 'as is' without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to data loss or incorrect AI-generated content.",
        },
        {
          title: "7. Changes to Terms",
          body:  "We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.",
        },
        {
          title: "8. Contact",
          body:  "For questions about these terms, contact us at: aryanathane@gmail.com",
        },
      ].map(({ title, body }) => (
        <div key={title} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</h2>
          <p style={{ fontSize: 14, color: "#3d5a80" }}>{body}</p>
        </div>
      ))}
    </div>
  );
}