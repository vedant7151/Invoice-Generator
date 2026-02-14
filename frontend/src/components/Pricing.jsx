/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { SignedOut, SignedIn, useAuth, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles, Zap, Crown } from "lucide-react";

const PricingCard = ({
  title,
  price,
  period,
  description,
  features = [],
  isPopular = false,
  isAnnual = false,
  delay = 0,
  onCtaClick,
}) => (
  // Outer Container: Position, hover movement, scale. NO overflow hidden so badge can float.
  <div
    style={{ transitionDelay: `${delay}ms` }}
    className={`group relative transition-all duration-700 ease-out hover:-translate-y-3 ${
      isPopular ? "scale-[1.05] z-20" : ""
    }`}
  >
    {/* Inner Container: Visual styling, background, limitations for overflowing effects */}
    <div
      className={`relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 border overflow-hidden ${
        isPopular
          ? "border-blue-400/60 shadow-[0_20px_70px_-15px_rgba(79,70,229,0.4)]"
          : "border-white/50 shadow-xl hover:shadow-2xl"
      }`}
    >
      {/* Background gradient effects (clipped inside) */}
      {isPopular && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-purple-50/30 z-0 pointer-events-none rounded-3xl" />
      )}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-10 blur-xl transition-all duration-700 z-10"></div>

      {/* Shine effect (clipped inside) */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>

      <div className="relative z-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {isPopular && <Sparkles className="w-5 h-5 text-blue-600" />}
            <h3
              className={`text-2xl font-bold ${
                isPopular
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                  : "text-gray-900"
              }`}
            >
              {title}
            </h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>

        {/* Price */}
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center gap-2">
            <span
              className={`text-5xl lg:text-6xl font-bold ${
                isPopular
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
                  : "text-gray-900"
              }`}
            >
              {price}
            </span>
            {period && <span className="text-gray-500 text-lg font-medium">/{period}</span>}
          </div>
          {isAnnual && (
            <div className="inline-flex items-center gap-1.5 text-sm text-emerald-700 font-semibold bg-emerald-100 px-4 py-1.5 rounded-full mt-3">
              <Zap className="w-3.5 h-3.5" />
              Save 20% Annually
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3 text-gray-700 group/item">
              <div
                className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 transition-all duration-300 ${
                  isPopular
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md group-hover/item:scale-110 group-hover/item:rotate-6"
                    : "bg-gray-100 text-gray-600 group-hover/item:bg-blue-100 group-hover/item:text-blue-600"
                }`}
              >
                <Check className="w-4 h-4" strokeWidth={3} />
              </div>
              <span className="text-sm lg:text-base leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Buttons */}
        <div className="mt-8">
          <SignedIn>
            <button
              type="button"
              onClick={() => onCtaClick && onCtaClick({ title, isPopular, isAnnual })}
              className={`relative w-full py-4 px-6 rounded-2xl font-bold transition-all duration-500 overflow-hidden group/btn ${
                isPopular
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] transform hover:scale-105"
                  : "bg-white border-2 border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50"
              }`}
            >
              {isPopular && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                </>
              )}
              <span className="relative flex items-center justify-center gap-2">
                {isPopular && <Zap className="w-4 h-4" />}
                {isPopular ? "Get Started" : "Choose Plan"}
                <svg
                  className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              </span>
            </button>
          </SignedIn>

          <SignedOut>
            <button
              type="button"
              onClick={() =>
                onCtaClick && onCtaClick({ title, isPopular, isAnnual }, { openSignInFallback: true })
              }
              className="w-full py-4 px-6 rounded-2xl font-semibold border-2 border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group/btn"
            >
              <span className="flex items-center justify-center gap-2">
                Sign in to get started
                <svg
                  className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              </span>
            </button>
          </SignedOut>
        </div>
      </div>
    </div>

    {/* Popular Badge (Moved outside overflow-hidden) */}
    {isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 whitespace-nowrap">
          <Crown className="w-4 h-4" />
          Most Popular
        </div>
      </div>
    )}

    {/* Corner accents for popular card (Moved outside) */}
    {isPopular && (
      <>
        <div className="absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-blue-400/50 rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-30 pointer-events-none"></div>
        <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-indigo-400/50 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-30 pointer-events-none"></div>
      </>
    )}
  </div>
);

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const clerk = useClerk();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const plans = {
    monthly: [
      {
        title: "Starter",
        price: "₹0",
        period: "month",
        description: "Perfect for freelancers and small projects",
        features: [
          "5 invoices per month",
          "Basic AI parsing",
          "Standard templates",
          "Email support",
          "PDF export",
        ],
        isPopular: false,
      },
      {
        title: "Professional",
        price: "₹499",
        period: "month",
        description: "For growing businesses and agencies",
        features: [
          "Unlimited invoices",
          "Advanced AI parsing",
          "Custom branding",
          "Priority support",
          "Advanced analytics",
          "Team collaboration (3 members)",
          "API access",
        ],
        isPopular: true,
      },
      {
        title: "Enterprise",
        price: "₹1,499",
        period: "month",
        description: "For large organizations with custom needs",
        features: [
          "Everything in Professional",
          "Unlimited team members",
          "Custom workflows",
          "Dedicated account manager",
          "SLA guarantee",
          "White-label solutions",
          "Advanced security",
        ],
        isPopular: false,
      },
    ],
    annual: [
      {
        title: "Starter",
        price: "₹0",
        period: "month",
        description: "Perfect for freelancers and small projects",
        features: [
          "5 invoices per month",
          "Basic AI parsing",
          "Standard templates",
          "Email support",
          "PDF export",
        ],
        isPopular: false,
        isAnnual: false,
      },
      {
        title: "Professional",
        price: "₹399",
        period: "month",
        description: "For growing businesses and agencies",
        features: [
          "Unlimited invoices",
          "Advanced AI parsing",
          "Custom branding",
          "Priority support",
          "Advanced analytics",
          "Team collaboration (3 members)",
          "API access",
        ],
        isPopular: true,
        isAnnual: true,
      },
      {
        title: "Enterprise",
        price: "₹1,199",
        period: "month",
        description: "For large organizations with custom needs",
        features: [
          "Everything in Professional",
          "Unlimited team members",
          "Custom workflows",
          "Dedicated account manager",
          "SLA guarantee",
          "White-label solutions",
          "Advanced security",
        ],
        isPopular: false,
        isAnnual: true,
      },
    ],
  };

  const currentPlans = plans[billingPeriod];

  function handleCtaClick(planMeta, flags = {}) {
    if (flags.openSignInFallback || !isSignedIn) {
      if (clerk && typeof clerk.openSignIn === "function") {
        clerk.openSignIn({ redirectUrl: "/app/create-invoice" });
      } else {
        navigate("/sign-in");
      }
      return;
    }

    navigate("/app/create-invoice", {
      state: { fromPlan: planMeta?.title || null },
    });
  }

  return (
    <section id="pricing" className="relative py-20 bg-gradient-to-b from-slate-50 via-white to-blue-50/30 overflow-hidden">
      {/* Enhanced background orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/50 to-cyan-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
      <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200/40 to-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-br from-violet-200/40 to-pink-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-xl border border-blue-200/50 shadow-lg mb-8">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </div>

          {/* Title */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
            Simple,{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Fair Pricing
            </span>
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
            Start free, upgrade as you grow. No hidden fees, no surprise charges.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white/90 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-200/60 shadow-xl">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-8 py-3.5 rounded-xl font-bold transition-all duration-300 ${
                billingPeriod === "monthly"
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-8 py-3.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${
                billingPeriod === "annual"
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-6 relative mb-16">
          {currentPlans.map((plan, index) => (
            <PricingCard
              key={plan.title}
              {...plan}
              delay={index * 100}
              onCtaClick={handleCtaClick}
            />
          ))}
        </div>

        {/* All Plans Include */}
        <div className="mt-20">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 border border-white/60 shadow-2xl max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-8 text-center">
              All plans include
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-gray-700">
              {[
                "Secure cloud storage",
                "Mobile-friendly interface",
                "Automatic backups",
                "Real-time notifications",
                "Multi-currency support",
                "Tax calculation",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 group">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:scale-150 transition-transform duration-300"></div>
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Sales */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-lg mb-4">Have questions about pricing?</p>
          <button className="group inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors duration-300">
            Contact our sales team
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14m-7-7l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;