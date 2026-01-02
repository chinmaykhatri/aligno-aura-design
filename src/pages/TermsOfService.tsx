import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Draft Banner */}
      <div className="bg-amber-500/20 border-b border-amber-500/40">
        <div className="container mx-auto px-6 py-3 flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span className="text-amber-500 font-medium text-sm">
            DRAFT - Not for legal use. Please consult a lawyer before publishing.
          </span>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Aligno's work intelligence platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Aligno provides a work intelligence platform that helps teams predict risks, simulate outcomes, and guide execution through AI-powered insights. The Service includes project management, task tracking, team collaboration, and predictive analytics features.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. User Accounts</h2>
            <h3 className="text-xl font-medium text-foreground">3.1 Registration</h3>
            <p className="text-muted-foreground leading-relaxed">
              You must register for an account to use certain features of the Service. You agree to provide accurate, current, and complete information during registration and to update such information as necessary.
            </p>

            <h3 className="text-xl font-medium text-foreground">3.2 Account Security</h3>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for safeguarding your account credentials and for any activities or actions under your account. You must notify us immediately of any unauthorized use of your account.
            </p>

            <h3 className="text-xl font-medium text-foreground">3.3 Account Termination</h3>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in conduct that we determine to be harmful to the Service or other users.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Subscription and Payments</h2>
            <h3 className="text-xl font-medium text-foreground">4.1 Pricing</h3>
            <p className="text-muted-foreground leading-relaxed">
              Aligno offers Free, Pro ($29/month), and Business ($79/month) subscription tiers. Prices are subject to change with 30 days notice.
            </p>

            <h3 className="text-xl font-medium text-foreground">4.2 Billing</h3>
            <p className="text-muted-foreground leading-relaxed">
              Paid subscriptions are billed monthly or annually in advance. All payments are non-refundable except as expressly set forth in these Terms.
            </p>

            <h3 className="text-xl font-medium text-foreground">4.3 Cancellation</h3>
            <p className="text-muted-foreground leading-relaxed">
              You may cancel your subscription at any time. Cancellation will take effect at the end of the current billing period.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload malicious code or content</li>
              <li>Impersonate any person or entity</li>
              <li>Harvest or collect user information without consent</li>
              <li>Use the Service to send spam or unsolicited communications</li>
              <li>Reverse engineer or attempt to extract source code</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Intellectual Property</h2>
            <h3 className="text-xl font-medium text-foreground">6.1 Our Content</h3>
            <p className="text-muted-foreground leading-relaxed">
              The Service and its original content, features, and functionality are owned by Aligno and are protected by international copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-medium text-foreground">6.2 Your Content</h3>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of content you create within the Service. By using the Service, you grant us a license to host, store, and display your content as necessary to provide the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. AI Features</h2>
            <p className="text-muted-foreground leading-relaxed">
              Aligno uses artificial intelligence to provide predictions and insights. While we strive for accuracy, AI-generated content is provided "as-is" without guarantee. You should use AI insights as one factor in your decision-making, not as the sole basis for critical decisions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Aligno shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless Aligno and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">13. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="text-muted-foreground">
              Email: legal@aligno.com<br />
              Address: Aligno Inc., 123 Innovation Drive, San Francisco, CA 94105
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
