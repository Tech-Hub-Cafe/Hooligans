import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PrivacyPolicyModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button type="button" className="text-gray-400 hover:text-teal transition-colors text-sm underline underline-offset-4">
                    Privacy Policy
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Privacy Policy</DialogTitle>
                    <DialogDescription>
                        Last updated: {new Date().toLocaleDateString()}
                    </DialogDescription>
                </DialogHeader>
                <div className="prose prose-sm dark:prose-invert mt-4 space-y-4">
                    <p>
                        At Hooligans, we are committed to protecting your privacy. This
                        Privacy Policy explains how we collect, use, and safeguard your
                        information when you visit our website or use our services.
                    </p>

                    <h3 className="font-bold text-lg">1. Information We Collect</h3>
                    <p>
                        We collect information you provide directly to us, such as when you
                        create an account, place an order, or subscribe to our newsletter.
                        This may include your name, email address, phone number, and payment
                        information (processed securely by Square).
                    </p>

                    <h3 className="font-bold text-lg">2. How We Use Your Information</h3>
                    <p>We use the information we collect to:</p>
                    <ul className="list-disc pl-5">
                        <li>Process and fulfill your orders.</li>
                        <li>Send you order confirmations and receipts.</li>
                        <li>Communicate with you about updates, offers, and promotions.</li>
                        <li>Improve our website and services.</li>
                    </ul>

                    <h3 className="font-bold text-lg">3. Information Sharing</h3>
                    <p>
                        We do not sell your personal information. We may share your
                        information with trusted third-party service providers (such as
                        payment processors like Square) solely to assist us in operating our
                        business and serving you.
                    </p>

                    <h3 className="font-bold text-lg">4. Data Security</h3>
                    <p>
                        We implement reasonable security measures to protect your personal
                        information. Payment transactions are encrypted and processed
                        through secure gateways.
                    </p>

                    <h3 className="font-bold text-lg">5. Contact Us</h3>
                    <p>
                        If you have any questions about this Privacy Policy, please contact
                        us at support@hooligans.com.au.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function TermsOfServiceModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button type="button" className="text-gray-400 hover:text-teal transition-colors text-sm underline underline-offset-4">
                    Terms of Service
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Terms of Service</DialogTitle>
                    <DialogDescription>
                        Last updated: {new Date().toLocaleDateString()}
                    </DialogDescription>
                </DialogHeader>
                <div className="prose prose-sm dark:prose-invert mt-4 space-y-4">
                    <p>
                        Welcome to Hooligans. By accessing or using our website and
                        services, you agree to be bound by these Terms of Service.
                    </p>

                    <h3 className="font-bold text-lg">1. Use of Services</h3>
                    <p>
                        You agree to use our services only for lawful purposes and in
                        accordance with these Terms. You must not use our website to engage
                        in any fraudulent or harmful activity.
                    </p>

                    <h3 className="font-bold text-lg">2. Ordering and Payments</h3>
                    <p>
                        All orders are subject to availability. Prices are listed in AUD
                        and include GST where applicable. Payment must be made at the time
                        of ordering. We reserve the right to refuse or cancel any order.
                    </p>

                    <h3 className="font-bold text-lg">3. User Accounts</h3>
                    <p>
                        If you create an account, you are responsible for maintaining the
                        confidentiality of your account credentials and for all activities
                        that occur under your account.
                    </p>

                    <h3 className="font-bold text-lg">4. Intellectual Property</h3>
                    <p>
                        All content on this website, including text, graphics, logos, and
                        images, is the property of Hooligans and protected by copyright
                        laws.
                    </p>

                    <h3 className="font-bold text-lg">5. Limitation of Liability</h3>
                    <p>
                        Hooligans shall not be liable for any indirect, incidental, or
                        consequential damages arising out of your use of our services.
                    </p>

                    <h3 className="font-bold text-lg">6. Changes to Terms</h3>
                    <p>
                        We reserve the right to modify these Terms at any time. Your
                        continued use of the site constitutes acceptance of the updated
                        Terms.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
