export default function PrivacyPage() {
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
        Privacy Policy
      </h1>
      <p style={{ color: "#7a94b0", fontSize: 14, marginBottom: 40 }}>
        Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      {[
        {
          title: "1. Introduction",
          body:  "MailMind ('we', 'our', or 'us') is an AI-powered email assistant that helps users triage and respond to emails. This Privacy Policy explains how we collect, use, and protect your information when you use our service.",
        },
        {
          title: "2. Information We Collect",
          body:  "We collect your Google account information (name, email address, profile picture) and Gmail access tokens when you sign in with Google. We also store email metadata (subject, sender, date) and email content solely to provide AI triage and reply draft features.",
        },
        {
          title: "3. How We Use Your Information",
          body:  "We use your information to: authenticate you via Google OAuth, fetch and display your emails, generate AI-powered triage categories and reply drafts using Groq AI, and improve the service. We do not sell, share, or use your email data for advertising purposes.",
        },
        {
          title: "4. Gmail Data",
          body:  "MailMind accesses your Gmail data only to provide core functionality: reading inbox emails, sending replies on your behalf, and marking emails as read. We request the minimum necessary Gmail scopes. Your email data is stored securely in MongoDB Atlas and is never shared with third parties.",
        },
        {
          title: "5. Data Retention",
          body:  "We retain your email data for as long as you use the service. You can request deletion of your data at any time by contacting us. When you revoke Gmail access from your Google account, we stop accessing your data immediately.",
        },
        {
          title: "6. Security",
          body:  "We implement industry-standard security measures including encrypted connections (HTTPS), secure token storage, and MongoDB Atlas security features. OAuth tokens are stored securely and refreshed automatically.",
        },
        {
          title: "7. Third-Party Services",
          body:  "We use the following third-party services: Google OAuth and Gmail API (authentication and email access), Groq AI (AI triage and draft generation — only email subject and body are sent), MongoDB Atlas (secure data storage), Vercel (hosting).",
        },
        {
          title: "8. Your Rights",
          body:  "You can revoke MailMind's access to your Gmail at any time via Google Account settings (myaccount.google.com/permissions). You can request deletion of all your data by emailing us. You can stop using the service at any time.",
        },
        {
          title: "9. Contact Us",
          body:  "If you have questions about this Privacy Policy, please contact us at: aryanathane@gmail.com",
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