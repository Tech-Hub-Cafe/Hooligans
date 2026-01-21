import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Hooligans",
  description: "Hooligans Terms of Service - Read our terms and conditions for using our services",
};

export default function TermsOfServicePage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString("en-US", { 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>

          <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
            <p>
              Welcome to Hooligans. By accessing or using our website and
              services, you agree to be bound by these Terms of Service. If you
              do not agree to these terms, please do not use our services.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                1. Use of Services
              </h2>
              <p>
                You agree to use our services only for lawful purposes and in
                accordance with these Terms. You must not use our website to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Engage in any fraudulent or harmful activity</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any malicious code or viruses</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                2. Ordering and Payments
              </h2>
              <p>
                All orders are subject to availability and acceptance by Hooligans.
                We reserve the right to refuse or cancel any order at our
                discretion.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>
                  <strong>Pricing:</strong> Prices are listed in AUD and include GST
                  where applicable. Prices are subject to change without notice.
                </li>
                <li>
                  <strong>Payment:</strong> Payment must be made at the time of
                  ordering through our secure payment processor (Square). We accept
                  major credit cards and digital payment methods.
                </li>
                <li>
                  <strong>Order Confirmation:</strong> You will receive an email
                  confirmation upon successful order placement. If you do not receive
                  a confirmation, please contact us.
                </li>
                <li>
                  <strong>Cancellations:</strong> Orders may be cancelled before
                  preparation begins. Contact us immediately if you need to cancel
                  an order.
                </li>
                <li>
                  <strong>Refunds:</strong> Refund policies are determined on a
                  case-by-case basis. Contact us for refund requests.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                3. Ordering Hours
              </h2>
              <p>
                We have specific ordering hours for food and drinks. Orders placed
                outside of these hours will not be processed. Please check our
                ordering hours before placing an order. We reserve the right to
                modify ordering hours at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                4. User Accounts
              </h2>
              <p>
                If you create an account, you are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Maintaining the confidentiality of your account credentials
                </li>
                <li>
                  All activities that occur under your account
                </li>
                <li>
                  Providing accurate and up-to-date information
                </li>
                <li>
                  Notifying us immediately of any unauthorized use
                </li>
              </ul>
              <p className="mt-4">
                We reserve the right to suspend or terminate accounts that violate
                these Terms or engage in fraudulent activity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                5. Intellectual Property
              </h2>
              <p>
                All content on this website, including but not limited to text,
                graphics, logos, images, and software, is the property of Hooligans
                or its content suppliers and is protected by Australian and
                international copyright laws.
              </p>
              <p className="mt-4">
                You may not reproduce, distribute, modify, or create derivative
                works from any content on this website without our express written
                permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                6. Limitation of Liability
              </h2>
              <p>
                To the fullest extent permitted by law, Hooligans shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Loss of profits or revenue</li>
                <li>Loss of data or information</li>
                <li>Loss of business opportunities</li>
                <li>Service interruptions or delays</li>
              </ul>
              <p className="mt-4">
                Our total liability for any claims arising from your use of our
                services shall not exceed the amount you paid for the specific
                order in question.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                7. Indemnification
              </h2>
              <p>
                You agree to indemnify and hold harmless Hooligans, its officers,
                directors, employees, and agents from any claims, damages, losses,
                liabilities, and expenses (including legal fees) arising from your
                use of our services or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                8. Third-Party Services
              </h2>
              <p>
                Our services may integrate with third-party services, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Square (payment processing)</li>
                <li>Google (authentication)</li>
                <li>Resend (email delivery)</li>
              </ul>
              <p className="mt-4">
                Your use of these third-party services is subject to their
                respective terms and conditions. We are not responsible for the
                actions or policies of these third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                9. Changes to Terms
              </h2>
              <p>
                We reserve the right to modify these Terms at any time. We will
                notify you of any material changes by posting the updated Terms on
                this page and updating the &quot;Last updated&quot; date. Your
                continued use of the site after such changes constitutes acceptance
                of the updated Terms.
              </p>
              <p className="mt-4">
                If you do not agree to the updated Terms, you must stop using our
                services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                10. Governing Law
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with
                the laws of Australia, without regard to its conflict of law
                provisions. Any disputes arising from these Terms shall be subject
                to the exclusive jurisdiction of the courts of Australia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                11. Contact Us
              </h2>
              <p>
                If you have any questions about these Terms of Service, please
                contact us:
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
