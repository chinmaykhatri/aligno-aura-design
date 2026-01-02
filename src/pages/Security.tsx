import { ArrowLeft, Shield, Lock, Eye, Server, FileCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const Security = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "Encryption",
      description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption."
    },
    {
      icon: Shield,
      title: "Access Control",
      description: "Role-based access control (RBAC) ensures users only access what they need."
    },
    {
      icon: Eye,
      title: "Audit Logging",
      description: "Comprehensive audit logs track all user actions and system events."
    },
    {
      icon: Server,
      title: "Infrastructure",
      description: "Hosted on enterprise-grade infrastructure with 99.9% uptime SLA."
    },
    {
      icon: FileCheck,
      title: "Compliance",
      description: "SOC 2 Type II certified with GDPR and CCPA compliance measures."
    },
    {
      icon: AlertTriangle,
      title: "Incident Response",
      description: "24/7 security monitoring with rapid incident response procedures."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-copper/10 mb-6">
            <Shield className="w-8 h-8 text-copper" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Security at Aligno</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your data security is our top priority. We implement industry-leading security practices to protect your information.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {securityFeatures.map((feature) => (
            <Card key={feature.title} className="bg-card border-border/40 hover:border-copper/30 transition-smooth">
              <CardContent className="pt-6">
                <feature.icon className="w-10 h-10 text-copper mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Data Protection</h2>
            <p className="text-muted-foreground leading-relaxed">
              We employ multiple layers of security to protect your data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Transport Security:</strong> All communications are encrypted using TLS 1.3 with strong cipher suites</li>
              <li><strong>Storage Encryption:</strong> Data at rest is encrypted using AES-256 encryption</li>
              <li><strong>Key Management:</strong> Encryption keys are managed using industry-standard key management practices</li>
              <li><strong>Database Security:</strong> Row-level security (RLS) policies ensure data isolation between organizations</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Authentication & Authorization</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Secure Authentication:</strong> Email/password with secure password hashing (bcrypt)</li>
              <li><strong>Session Management:</strong> Secure session tokens with automatic expiration</li>
              <li><strong>Role-Based Access:</strong> Granular permissions for project owners, admins, and members</li>
              <li><strong>Invitation System:</strong> Secure project invitations with expiring tokens</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Infrastructure Security</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Cloud Infrastructure:</strong> Hosted on enterprise-grade cloud infrastructure with SOC 2 certification</li>
              <li><strong>Network Security:</strong> Firewalls, intrusion detection, and DDoS protection</li>
              <li><strong>Regular Updates:</strong> Continuous patching and security updates</li>
              <li><strong>Backup & Recovery:</strong> Automated daily backups with point-in-time recovery</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Compliance & Certifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              Aligno maintains compliance with major security standards and regulations:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>SOC 2 Type II:</strong> Audited controls for security, availability, and confidentiality</li>
              <li><strong>GDPR:</strong> Full compliance with EU data protection regulations</li>
              <li><strong>CCPA:</strong> Compliance with California Consumer Privacy Act</li>
              <li><strong>HIPAA:</strong> Available for healthcare organizations (Business plan)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Security Practices</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Vulnerability Scanning:</strong> Regular automated security scans</li>
              <li><strong>Penetration Testing:</strong> Annual third-party penetration tests</li>
              <li><strong>Code Review:</strong> Security-focused code reviews for all changes</li>
              <li><strong>Employee Training:</strong> Regular security awareness training for all team members</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Incident Response</h2>
            <p className="text-muted-foreground leading-relaxed">
              In the event of a security incident, we follow a structured response process:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Detection:</strong> 24/7 monitoring with automated alerting</li>
              <li><strong>Response:</strong> Immediate containment and investigation</li>
              <li><strong>Notification:</strong> Timely notification to affected users as required by law</li>
              <li><strong>Recovery:</strong> Systematic recovery and post-incident review</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Responsible Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">
              We welcome security researchers to report vulnerabilities responsibly. If you discover a security issue, please contact us at security@aligno.com. We commit to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Acknowledge receipt within 24 hours</li>
              <li>Provide regular updates on our investigation</li>
              <li>Not pursue legal action against good-faith researchers</li>
              <li>Credit researchers who help improve our security (with permission)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For security-related inquiries, please contact:
            </p>
            <p className="text-muted-foreground">
              Email: security@aligno.com<br />
              For urgent security issues: security-urgent@aligno.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Security;
