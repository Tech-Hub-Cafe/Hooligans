import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Hooligans",
  description: "Hooligans Privacy Policy - Learn how we collect, use, and protect your information",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-teal hover:text-teal-dark mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString("en-US", { 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>

          <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
            <p>
              At Hooligans, we are committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, and safeguard your
              information when you visit our website or use our services.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                1. Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us, such as when you
                create an account, place an order, or subscribe to our newsletter.
                This may include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name and contact information (email address, phone number)</li>
                <li>Payment information (processed securely by Square payment processor)</li>
                <li>Order history and preferences</li>
                <li>Account credentials (password, stored securely using bcrypt)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                2. How We Use Your Information
              </h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Send you order confirmations and receipts via email</li>
                <li>Communicate with you about your orders and account</li>
                <li>Send you updates, offers, and promotions (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Respond to your inquiries and provide customer support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                3. Information Sharing
              </h2>
              <p>
                We do not sell your personal information. We may share your
                information with trusted third-party service providers solely to
                assist us in operating our business and serving you, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Square</strong> - Payment processing and order management
                </li>
                <li>
                  <strong>Resend</strong> - Email delivery service for order confirmations and receipts
                </li>
                <li>
                  <strong>Google</strong> - OAuth authentication (if you choose to sign in with Google)
                </li>
              </ul>
              <p className="mt-4">
                These service providers are contractually obligated to protect your
                information and use it only for the purposes we specify.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                4. Data Security
              </h2>
              <p>
                We implement reasonable security measures to protect your personal
                information, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encrypted password storage using bcrypt hashing</li>
                <li>Secure HTTPS connections for all data transmission</li>
                <li>Payment transactions processed through secure gateways (Square)</li>
                <li>Rate limiting and input validation to prevent unauthorized access</li>
                <li>Regular security updates and monitoring</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                5. Cookies and Tracking
              </h2>
              <p>
                We use cookies and similar technologies to enhance your experience,
                including session management for authentication. You can control
                cookies through your browser settings, though this may affect
                website functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                6. Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us using the information
                provided below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                7. Children&apos;s Privacy
              </h2>
              <p>
                Our services are not intended for children under 13 years of age.
                We do not knowingly collect personal information from children. If
                you believe we have collected information from a child, please
                contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                8. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify
                you of any changes by posting the new Privacy Policy on this page
                and updating the &quot;Last updated&quot; date. You are advised to
                review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                9. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy or wish to
                exercise your rights, please contact us:
              </p>
              <ul className="list-none pl-0 space-y-2 mt-4">
                <li>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:support@hooligans.com.au"
                    className="text-teal hover:text-teal-dark underline"
                  >
                    support@hooligans.com.au
                  </a>
                </li>
                <li>
                  <strong>Website:</strong>{" "}
                  <Link href="/contact" className="text-teal hover:text-teal-dark underline">
                    Contact Page
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
