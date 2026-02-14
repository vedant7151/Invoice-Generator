import React from 'react';
import { Sparkles, Twitter, Linkedin, Github, Mail, ArrowRight, Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-slate-50 pt-20 pb-10 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
      <div className="absolute top-20 -left-20 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-30 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Invoice AI
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed max-w-sm">
              Transforming how businesses handle invoicing with the power of artificial intelligence. Lightning fast, accurate, and professional.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: <Twitter className="w-5 h-5" />, href: "#", color: "hover:text-blue-400" },
                { icon: <Linkedin className="w-5 h-5" />, href: "#", color: "hover:text-blue-700" },
                { icon: <Github className="w-5 h-5" />, href: "#", color: "hover:text-gray-900" },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className={`p-2.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:shadow-md transition-all duration-300 ${social.color}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="font-bold text-gray-900">Product</h4>
            <ul className="space-y-4">
              {['Features', 'Pricing', 'Templates', 'Enterprise'].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className="text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm block hover:translate-x-1 duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h4 className="font-bold text-gray-900">Company</h4>
            <ul className="space-y-4">
              {['About Us', 'Careers', 'Blog', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm block hover:translate-x-1 duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="lg:col-span-4 space-y-6">
            <h4 className="font-bold text-gray-900">Stay Updated</h4>
            <p className="text-gray-600 text-sm">
              Get the latest updates, articles and resources sent to your inbox correctly.
            </p>
            <form className="relative group">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 pl-11"
              />
              <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-gray-200/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-500 text-sm">
            &copy; {currentYear} Invoice AI. All rights reserved.
          </div>
          
          <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Cookies</a>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-white/50 px-3 py-1 rounded-full border border-gray-100">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
            <span>by Vedant Gada</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;