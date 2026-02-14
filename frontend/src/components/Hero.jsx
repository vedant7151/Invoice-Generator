
import React from "react";
import { SignedIn, SignedOut, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, Check } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();
  const clerk = useClerk();

  const handleSignedInPrimary = () => {
    navigate("/app/create-invoice");
  };

  const handleSignedOutPrimary = () => {
    try {
      if (clerk && typeof clerk.openSignUp === "function") {
        clerk.openSignUp();
      }
    } catch (error) {
      console.log("Failed to open clerks sign up model", error);
    }
  };
  
  return (
    <section className="relative min-h-screen pb-16 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
      {/* Enhanced animated background orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl opacity-40 bg-gradient-to-br from-blue-400/50 to-cyan-400/30 animate-float-slow"></div>
      <div className="absolute bottom-1/4 -right-20 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-35 bg-gradient-to-br from-violet-400/40 to-fuchsia-400/30 animate-float-medium"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full blur-3xl opacity-20 bg-gradient-to-br from-indigo-300/30 to-purple-300/20 animate-pulse-slow"></div>

      {/* Enhanced grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,black_40%,transparent_100%)]"></div>

      <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-8 lg:pt-24 lg:pb-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Column - Content */}
          <div className="space-y-10 lg:space-y-12">
            <div className="space-y-8">
              {/* Enhanced badge */}
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-xl border border-blue-200/50 shadow-lg">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  AI-Powered Invoicing Platform
                </span>
              </div>

              {/* Enhanced Main heading */}
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                <span className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Professional</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Invoices</span>
                <br />
                <span className="bg-gradient-to-br from-gray-700 to-gray-600 bg-clip-text text-transparent">in Seconds</span>
              </h1>

              {/* Enhanced description */}
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-xl">
                Transform conversations into professional invoices with AI.{" "}
                <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Paste any text
                </span>{" "}
                and watch AI extract items, calculate totals, and generate
                ready-to-send invoices instantly.
              </p>
            </div>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <SignedIn>
                <button
                  type="button"
                  onClick={handleSignedInPrimary}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 lg:px-10 lg:py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(79,70,229,0.5)] transform hover:scale-105 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <Zap className="w-5 h-5 relative" />
                  <span className="relative">Start Creating for Free</span>
                  <svg
                    className="w-5 h-5 relative group-hover:translate-x-1 transition-transform duration-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                </button>
              </SignedIn>

              <SignedOut>
                <button
                  type="button"
                  onClick={handleSignedOutPrimary}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 lg:px-10 lg:py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(79,70,229,0.5)] transform hover:scale-105 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <Zap className="w-5 h-5 relative" />
                  <span className="relative">Start Creating for Free</span>
                  <svg
                    className="w-5 h-5 relative group-hover:translate-x-1 transition-transform duration-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                </button>
              </SignedOut>

              <a 
                href="#features" 
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 lg:px-10 lg:py-5 rounded-2xl bg-white/90 backdrop-blur-xl border-2 border-gray-200/80 text-gray-700 font-semibold shadow-xl hover:shadow-2xl hover:border-gray-300 transform hover:scale-105 transition-all duration-300"
              >
                <span>Explore Features</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Enhanced Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: <Sparkles className="w-5 h-5" />, label: "AI-Powered", desc: "Smart parsing" },
                { icon: <Zap className="w-5 h-5" />, label: "Lightning Fast", desc: "Instant generation" },
                { icon: <Check className="w-5 h-5" />, label: "Professional", desc: "Branded templates" },
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="group flex items-center gap-3 p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{feature.label}</div>
                    <div className="text-sm text-gray-600">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Enhanced Invoice Preview */}
          <div className="relative w-full">
            {/* Background glow effects */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-40 animate-float-slow"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-violet-200 to-purple-200 rounded-full blur-3xl opacity-30 animate-float-medium"></div>

            <div className="relative group">
              {/* Enhanced Invoice Card */}
              <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-8 transform transition-all duration-700 group-hover:scale-[1.02] group-hover:shadow-[0_25px_70px_-15px_rgba(79,70,229,0.4)]">
                {/* Animated gradient border */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 blur-xl transition-all duration-700"></div>
                
                {/* Header */}
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-gray-200/80 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        AI
                      </div>
                      <div>
                        <div className="font-bold text-xl text-gray-900">ARMANI</div>
                        <div className="text-sm text-gray-500">GST: 27AAAPLPA7892</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</div>
                    <div className="font-bold text-xl text-gray-900">#INV-1024</div>
                    <div className="inline-block text-xs text-emerald-700 font-semibold bg-emerald-100 px-3 py-1 rounded-full mt-2">
                      Paid
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="relative py-6 space-y-3">
                  {[
                    { description: "Website Design & Development", amount: "₹15,000" },
                    { description: "Consultation (2 hours)", amount: "₹3,000" },
                    { description: "Premium Hosting Setup", amount: "₹2,500" },
                  ].map((item, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-300 group/item"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 group-hover/item:scale-150 transition-transform duration-300"></div>
                        <span className="text-gray-700 font-medium text-sm sm:text-base">{item.description}</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm sm:text-base">{item.amount}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="relative space-y-3 pt-6 border-t border-gray-200/80">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">₹20,500</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">GST (18%)</span>
                    <span className="font-semibold text-gray-900">₹3,690</span>
                  </div>
                  <div className="flex justify-between text-lg sm:text-xl font-bold pt-3 border-t border-gray-200/80">
                    <span className="text-gray-900">Total Amount</span>
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      ₹24,190
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="relative flex flex-col sm:flex-row gap-3 pt-6">
                  <button className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 group/btn">
                    <span className="group-hover/btn:scale-105 inline-block transition-transform duration-200">Preview</span>
                  </button>
                  <button className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    Send Invoice
                  </button>
                </div>
              </div>



              {/* Corner accents */}
              <div className="absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-blue-400/50 rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-indigo-400/50 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>

            {/* Soft glow behind card */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-100/40 via-indigo-100/30 to-purple-100/20 rounded-3xl blur-2xl transform scale-105"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
