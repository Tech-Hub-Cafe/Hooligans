"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Loader2 } from "lucide-react";

interface CafeSettings {
  cafe_name: string;
  address: string;
  phone: string;
  email: string;
  monday_hours: string;
  tuesday_hours: string;
  wednesday_hours: string;
  thursday_hours: string;
  friday_hours: string;
  saturday_hours: string;
  sunday_hours: string;
}

async function fetchSettings(): Promise<CafeSettings> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["cafe-settings"],
    queryFn: fetchSettings,
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  // Update page title
  useEffect(() => {
    document.title = `Contact Us | ${settings?.cafe_name || "Hooligans"}`;
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-24 plaid-pattern">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">Get in Touch</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Questions, feedback, or just want to say hi? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold mb-8">
                Visit <span className="text-teal">{settings?.cafe_name || "Hooligans"}</span>
              </h2>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-teal" />
                </div>
              ) : (
                <div className="space-y-6">
                  {settings?.address && (
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6 flex items-start gap-4">
                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shrink-0">
                          <MapPin className="w-6 h-6 text-teal" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1">Location</h3>
                          <p className="text-gray-600">{settings.address}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6 text-teal" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">Hours</h3>
                        {settings ? (
                          <div className="space-y-1">
                            <p className="text-gray-600">Monday: {settings.monday_hours || "Closed"}</p>
                            <p className="text-gray-600">Tuesday: {settings.tuesday_hours || "Closed"}</p>
                            <p className="text-gray-600">Wednesday: {settings.wednesday_hours || "Closed"}</p>
                            <p className="text-gray-600">Thursday: {settings.thursday_hours || "Closed"}</p>
                            <p className="text-gray-600">Friday: {settings.friday_hours || "Closed"}</p>
                            <p className="text-gray-600">Saturday: {settings.saturday_hours || "Closed"}</p>
                            <p className="text-gray-600">Sunday: {settings.sunday_hours || "Closed"}</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-600">Monday - Friday: 7am - 8pm</p>
                            <p className="text-gray-600">Saturday - Sunday: 8am - 9pm</p>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {settings?.phone && (
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6 flex items-start gap-4">
                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shrink-0">
                          <Phone className="w-6 h-6 text-teal" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1">Phone</h3>
                          <a
                            href={`tel:${settings.phone}`}
                            className="text-gray-600 hover:text-teal transition-colors block"
                          >
                            {settings.phone}
                          </a>
                          <p className="text-gray-500 text-sm">Call us for reservations or catering</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {settings?.email && (
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6 flex items-start gap-4">
                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shrink-0">
                          <Mail className="w-6 h-6 text-teal" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1">Email</h3>
                          <a
                            href={`mailto:${settings.email}`}
                            className="text-gray-600 hover:text-teal transition-colors block"
                          >
                            {settings.email}
                          </a>
                          <p className="text-gray-500 text-sm">We typically respond within 24 hours</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Map Placeholder */}
              <div className="mt-8 h-64 bg-gray-200 rounded-2xl overflow-hidden relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0977904807944!2d-122.41941658468204!3d37.77492977975903!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085809c6c8f4459%3A0xb10ed6d9b5050fa5!2sSan%20Francisco%2C%20CA!5e0!3m2!1sen!2sus!4v1699999999999!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-300"
                />
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-8">
                Send a <span className="text-teal">Message</span>
              </h2>

              {submitted ? (
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Message Sent!</h3>
                    <p className="text-gray-600 mb-6">
                      Thanks for reaching out. We&apos;ll get back to you as soon as possible.
                    </p>
                    <Button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: "", email: "", subject: "", message: "" });
                      }}
                      className="bg-teal hover:bg-teal-dark text-white"
                    >
                      Send Another Message
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="text-base">Name *</Label>
                          <Input
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your name"
                            className="mt-2 h-12"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-base">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                            className="mt-2 h-12"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="subject" className="text-base">Subject *</Label>
                        <Input
                          id="subject"
                          required
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="What's this about?"
                          className="mt-2 h-12"
                        />
                      </div>

                      <div>
                        <Label htmlFor="message" className="text-base">Message *</Label>
                        <Textarea
                          id="message"
                          required
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Tell us what's on your mind..."
                          className="mt-2 min-h-[150px] resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-teal hover:bg-teal-dark text-white font-semibold py-6 text-lg"
                      >
                        {isSubmitting ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* FAQ Teaser */}
              <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
                <h3 className="font-bold text-lg mb-3">Frequently Asked</h3>
                <div className="space-y-3 text-gray-600">
                  <p><strong className="text-black">Do you offer catering?</strong> Yes! Contact us for events of any size.</p>
                  <p><strong className="text-black">Is there parking?</strong> Street parking available, plus a lot behind the building.</p>
                  <p><strong className="text-black">Do you have WiFi?</strong> Free high-speed WiFi for all customers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

