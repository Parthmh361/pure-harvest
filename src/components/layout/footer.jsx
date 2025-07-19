import Link from 'next/link'
import { Leaf, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold">PureHarvest</span>
            </div>
            <p className="text-gray-200 mb-4">
              Connecting farmers directly with buyers for the freshest agricultural products. 
              Farm to table, with transparency and quality guaranteed.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 hover:text-gray-300 cursor-pointer" />
              <Twitter className="h-5 w-5 hover:text-gray-300 cursor-pointer" />
              <Instagram className="h-5 w-5 hover:text-gray-300 cursor-pointer" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-gray-200 hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products/fruits" className="text-gray-200 hover:text-white transition-colors">
                  Fruits
                </Link>
              </li>
              <li>
                <Link href="/products/vegetables" className="text-gray-200 hover:text-white transition-colors">
                  Vegetables
                </Link>
              </li>
              <li>
                <Link href="/products/organic" className="text-gray-200 hover:text-white transition-colors">
                  Organic Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-200 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Users */}
          {/* <div>
            <h3 className="text-lg font-semibold mb-4">For Users</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/signup?role=buyer" className="text-gray-200 hover:text-white transition-colors">
                  Buy Products
                </Link>
              </li>
              <li>
                <Link href="/signup?role=farmer" className="text-gray-200 hover:text-white transition-colors">
                  Sell Products
                </Link>
              </li>
              <li>
                <Link href="/signup?role=logistics" className="text-gray-200 hover:text-white transition-colors">
                  Delivery Services
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-200 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-200 hover:text-white transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div> */}

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-300" />
                <span className="text-gray-200">support@pureharvest.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-300" />
                <span className="text-gray-200">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-300 mt-0.5" />
                <span className="text-gray-200">
                  123 Farm Street<br />
                  Agriculture City, AC 12345
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-600 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-200 text-sm">
              © {currentYear} PureHarvest. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-200 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-200 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-200 hover:text-white text-sm transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}