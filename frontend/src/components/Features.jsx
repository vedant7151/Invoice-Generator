
// import React from 'react'
import { FileText, Mail, ChevronRight, Sparkles } from "lucide-react"
import { useClerk } from "@clerk/clerk-react"

// FIX 1: Changed { to ( here to implicitly return the JSX
const FeatureCard  = ({title , desc , icon , delay=0}) => {
  const clerk = useClerk();
  
  const handleLearnMoreClick = () => {
    try {
      if (clerk && typeof clerk.openSignIn === "function") {
        clerk.openSignIn();
      }
    } catch (error) {
      console.log("Failed to open sign-in modal", error);
    }
  };
  
  return (
    <div 
      className="group relative bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-700 ease-out hover:-translate-y-3 overflow-hidden"
      style={{transitionDelay : `${delay}ms`}}
    >
    {/* Layered gradient backgrounds */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    
    {/* Animated gradient border effect */}
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 blur-xl transition-all duration-700"></div>
    
    {/* Shine effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
    
    <div className="relative flex items-start gap-6">
      {/* Enhanced icon container with rotating gradient */}
      <div className="shrink-0 w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white shadow-lg group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
        <div className="group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
      </div>
      
      <div className="flex-1">
        <h4 className="text-lg md:text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-indigo-600 group-hover:to-purple-600 transition-all duration-500">{title}</h4>
        <p className="mt-3 text-sm lg:text-base text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-500">{desc}</p>

        <div 
          onClick={handleLearnMoreClick}
          className="mt-5 flex items-center text-indigo-600 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500 cursor-pointer"
        >
          <span className="text-sm font-semibold">Learn more</span>
          <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-2 transition-transform duration-500" />
        </div>
      </div>
    </div>
    
    {/* Corner accent decorations */}
    <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-indigo-400/30 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-purple-400/30 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
  </div>
  );
}

const Features = () => {
    const features = [
    {
      title: "AI Invoice Parsing",
      desc: "Paste freeform text and let our advanced AI extract client details, line items, and totals into a perfectly formatted draft invoice in seconds.",
      icon: (
        <Sparkles size={24} strokeWidth={2.5} />
      ),
    },
    {
      title: "Smart Email Reminders",
      desc: "Generate professional, context-aware reminder emails with one click — complete with intelligent tone selection and personalized messaging.",
      icon: (
        <Mail size={24} strokeWidth={2.5} />
      ),
    },
    {
      title: "Professional PDF Export",
      desc: "Generate high-quality, brand-consistent PDF invoices with reliable email delivery and comprehensive tracking of all sent communications.",
      icon: (
        <FileText size={24} strokeWidth={2.5} />
      ),
    },
  ];


  return (
    <section id='features' className="relative py-16 bg-gradient-to-b from-slate-50 via-white to-blue-50/30 overflow-hidden">
      
      {/* Enhanced blob animations with more organic movement */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/60 to-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/50 to-pink-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-br from-indigo-200/40 to-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          {/* Enhanced badge with gradient */}
          <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 backdrop-blur-sm shadow-sm mb-8">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-2.5 animate-pulse"></span>
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">Powerful Features</span>
          </div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
            Built for {" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Speed & Clarity
            </span>
          </h2>

          <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            A minimal, intelligent interface that focuses on what truly matters
            —create, send, and track invoices effortlessly while maintaining 
            professional excellence.
          </p>
        </div>

        {/* Enhanced grid with better spacing */}
        <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 relative">
          {/* FIX 2: Added 'return' explicitly, OR you can use ( ) like FeatureCard above */}
          {features.map((feature , index) => (
             <FeatureCard 
                key={feature.title} 
                title={feature.title} 
                desc={feature.desc} 
                icon={feature.icon} 
                delay={index*150}
             />
          ))}
        </div>

        {/* Enhanced bottom CTA with gradient */}
        <div className="mt-20 text-center">
          <button className="group relative inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-500 overflow-hidden">
            {/* Shine effect on button */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span className="relative">Explore All Features </span>
              <ChevronRight className="w-5 h-5 ml-2 relative transform group-hover:translate-x-2 transition-transform duration-500" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default Features