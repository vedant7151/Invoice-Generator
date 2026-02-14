import React, { useEffect, useState } from "react";
import GeminiIcon from "./GeminiIcon";
import AnimatedButton from "../assets/GenerateBtn/Gbtn";
import { X } from "lucide-react";

const AiInvoiceModal = ({ open, onClose, onGenerate, initialText = "" }) => {
  const [text, setText] = useState(initialText || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setText(initialText || "");
    setError("");
    setLoading(false);
  }, [initialText, open]);

  if (!open) {
    return null;
  }

  async function handleGenerateClick() {
    setError("");
    const raw = (text || "").trim();
    if (!raw) {
      setError("Please paste invoice text to generate from AI");
      return;
    }

    try {
      setLoading(true);
      const maybePromise = onGenerate && onGenerate(raw);

      if (maybePromise && typeof maybePromise.then === "function") {
        await maybePromise;
      }
    } catch (error) {
      console.log("On generate hanfler Failed", error);
      setError("Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => onClose && onClose()}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 z-10 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="inline-flex items-center gap-2 text-xl font-bold text-gray-900 group">
              <div className="p-2 bg-indigo-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                 <GeminiIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Create Invoice with AI
              </span>
            </h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-md">
              Paste your invoice details below (client, items, quantities, prices) and let our AI automatically structure it for you.
            </p>
          </div>

          <button 
            onClick={() => onClose && onClose()}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">
            Invoice Details
          </label>
          <div className="relative group">
            <textarea
                value={text}
                rows={8}
                onChange={(e) => setText(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-sm hover:border-gray-300"
                placeholder="Example: create an invoice for John Doe (john@example.com) for Web Design Services ($1500) and SEO Optimization ($500). Due in 14 days."
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none bg-white/50 px-2 py-1 rounded-md backdrop-blur-sm">
                {text.length} chars
            </div>
          </div>
        </div>

        {error && (
            <div className="mt-4 rounded-xl bg-rose-50 p-4 border border-rose-100 animate-in fade-in slide-in-from-top-2 duration-200" role="alert">
                <div className="flex items-start gap-3">
                    <div className="text-rose-500 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="text-sm text-rose-700">
                        {String(error).split("\n").map((line, i) => (
                            <div key={i}>{line}</div>
                        ))}
                         {/quota|exhausted|resource_exhausted/i.test(String(error)) && (
                            <p className="mt-1 text-xs text-rose-600 font-medium">
                                Tip: AI service is temporarily busy. Please try again in 2-3 minutes or create manually.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        )}

        <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <button 
                onClick={() => onClose && onClose()}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
            >
                Cancel
            </button>
            <div className="w-32">
                 <AnimatedButton 
                    onClick={handleGenerateClick} 
                    isLoading={loading} 
                    disabled={loading} 
                    label="Generate"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AiInvoiceModal;
