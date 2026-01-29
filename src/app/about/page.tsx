import type { Metadata } from "next";
import { Users, Heart, Leaf, Award } from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Hooligans - our story, values, and commitment to exceptional coffee and community. Discover what makes us special and why we're passionate about artisan coffee and handcrafted cuisine.",
  openGraph: {
    title: "About Us | Hooligans",
    description: "Learn about Hooligans - our story, values, and commitment to exceptional coffee and community.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About Us | Hooligans",
    description: "Learn about Hooligans - our story, values, and commitment to exceptional coffee and community.",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-24 plaid-pattern">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">Our Story</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            More than just a cafe — we&apos;re a community gathering spot where good coffee meets great company
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Born from a Love of <span className="text-teal">Coffee & Community</span>
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed text-lg">
                Hooligans started in 2026 with a simple idea: create a space where everyone 
                feels welcome, the coffee is always exceptional, and every visit feels like 
                coming home.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed text-lg">
                Our name reflects our playful spirit — we don&apos;t take ourselves too seriously, 
                but we&apos;re dead serious about quality. From our carefully sourced beans to our 
                scratch-made pastries, everything we serve is crafted with intention and care.
              </p>
              <p className="text-gray-600 leading-relaxed text-lg">
                Whether you&apos;re grabbing a quick espresso, settling in for a work session, 
                or catching up with friends, Hooligans is your place.
              </p>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800"
                alt="Inside Hooligans cafe"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">
            What We <span className="text-teal">Stand For</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center group hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-8 h-8 text-teal" />
              </div>
              <h3 className="text-xl font-bold mb-3">Quality First</h3>
              <p className="text-gray-600">
                We source the best beans and ingredients, no compromises
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg text-center group hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-teal" />
              </div>
              <h3 className="text-xl font-bold mb-3">Community</h3>
              <p className="text-gray-600">
                Building connections one cup at a time
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg text-center group hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Leaf className="w-8 h-8 text-teal" />
              </div>
              <h3 className="text-xl font-bold mb-3">Sustainability</h3>
              <p className="text-gray-600">
                Eco-friendly practices from farm to cup
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg text-center group hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-teal" />
              </div>
              <h3 className="text-xl font-bold mb-3">Passion</h3>
              <p className="text-gray-600">
                Love in every latte, care in every bite
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Come Say Hello
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            We&apos;d love to meet you. Stop by for a coffee and become part of the Hooligans family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/menu" className="inline-flex items-center justify-center bg-teal hover:bg-teal-dark text-white font-semibold px-8 py-4 rounded-lg transition-all">
              View Our Menu
            </a>
            <a href="/contact" className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-lg transition-all border border-white/30">
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

