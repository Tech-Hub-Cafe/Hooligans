import { Coffee } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Coffee className="w-6 h-6 text-teal" />
              <span className="text-xl font-bold">Hooligans</span>
            </div>
            <p className="text-gray-400">
              Your neighborhood spot for exceptional coffee and good vibes since 2024.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-teal">Hours</h3>
            <p className="text-gray-400">Monday - Friday: 7am - 8pm</p>
            <p className="text-gray-400">Saturday - Sunday: 8am - 9pm</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-teal">Contact</h3>
            <p className="text-gray-400">123 Coffee Street</p>
            <p className="text-gray-400">hello@hooliganscafe.com</p>
            <p className="text-gray-400">(555) 123-4567</p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; 2024 Hooligans. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

