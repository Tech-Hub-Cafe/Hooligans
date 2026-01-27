import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Award } from "lucide-react";
import Image from "next/image";
import HomeStructuredData from "@/components/seo/HomeStructuredData";
import StructuredData from "@/components/seo/StructuredData";

export const metadata: Metadata = {
  title: "Home",
  description: "Experience artisanal coffee and handcrafted cuisine in a warm, sophisticated atmosphere. Order online for pickup or delivery. Fresh food, great coffee, exceptional service at Hooligans.",
  openGraph: {
    title: "Hooligans | Artisan Coffee & Cuisine",
    description: "Experience artisanal coffee and handcrafted cuisine. Order online for pickup or delivery.",
    type: "website",
    images: ["/logo/Hooligans-Hero-Logo-2.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hooligans | Artisan Coffee & Cuisine",
    description: "Experience artisanal coffee and handcrafted cuisine. Order online for pickup or delivery.",
  },
};

export default function Home() {
  return (
    <div className="bg-white">
      <HomeStructuredData />
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/tartan-bg.png"
            alt="Hooligans Tartan Pattern"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <div className="inline-block mb-6 px-6 py-2 bg-teal rounded-full">
            <span className="text-white font-medium tracking-wide">EST. 2024</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
            Where Flavor
            <br />
            <span className="text-teal">Meets Tradition</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Experience artisanal coffee and handcrafted cuisine in a warm, sophisticated
            atmosphere
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full max-w-2xl mx-auto px-4">
            <Link href="/menu" className="flex-1 w-full sm:w-auto min-w-[200px] sm:min-w-[280px]">
              <Button className="w-full bg-teal hover:bg-teal-dark text-white font-semibold px-8 sm:px-12 py-6 sm:py-7 text-base sm:text-lg rounded-xl shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                Start Ordering
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </Link>
            <Link href="/about" className="flex-1 w-full sm:w-auto min-w-[200px] sm:min-w-[280px]">
              <Button
                variant="outline"
                className="w-full bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-black font-semibold px-8 sm:px-12 py-6 sm:py-7 text-base sm:text-lg rounded-xl transition-all duration-300 hover:scale-105"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-2xl flex items-center justify-center p-2 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Image
                  src="/logo/Hooligans-Hero-Logo-2.png"
                  alt="Hooligans Logo"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold mb-4">Premium Coffee</h3>
              <p className="text-gray-600 leading-relaxed">
                Sourced from the finest beans around the world, roasted to perfection
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Clock className="w-10 h-10 text-teal" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Fresh Daily</h3>
              <p className="text-gray-600 leading-relaxed">
                Everything made fresh daily with locally sourced ingredients
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Award className="w-10 h-10 text-teal" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Award Winning</h3>
              <p className="text-gray-600 leading-relaxed">
                Recognized for excellence in quality and customer service
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 plaid-pattern opacity-20" />

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">Ready to Order?</h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">
            Browse our menu and place your order for pickup or delivery
          </p>
          <Link href="/menu">
            <Button className="bg-teal hover:bg-teal-dark text-white font-semibold px-10 py-6 text-lg rounded-lg shadow-xl transition-all duration-300 hover:scale-105">
              Explore Our Menu
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Image Gallery Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            A Taste of <span className="text-teal">Excellence</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative h-80 rounded-2xl overflow-hidden group cursor-pointer">
              <Image
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800"
                alt="Coffee"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <h3 className="text-white text-2xl font-bold">Artisan Coffee</h3>
              </div>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden group cursor-pointer">
              <Image
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800"
                alt="Pastries"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <h3 className="text-white text-2xl font-bold">Fresh Pastries</h3>
              </div>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden group cursor-pointer">
              <Image
                src="https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?w=800"
                alt="Atmosphere"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                <h3 className="text-white text-2xl font-bold">Cozy Atmosphere</h3>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
