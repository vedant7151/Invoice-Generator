
import React from 'react';
import { 
  LayoutDashboard, 
  IndianRupee, 
  TrendingUp, 
  FileText, 
  Clock, 
  Info 
} from 'lucide-react';

const MetricIcons = {
  default: LayoutDashboard,
  revenue: IndianRupee,
  growth: TrendingUp,
  document: FileText,
  clock: Clock,
};

const KpiCard = ({ 
  title, 
  value, 
  hint, 
  iconType = "default", 
  trend, 
  className = "" 
}) => {
  const IconComponent = MetricIcons[iconType] || MetricIcons.default;

  // Inline mapping for icon gradients
  const iconGradients = {
    default: "from-blue-500 to-indigo-600",
    revenue: "from-emerald-500 to-green-600",
    growth: "from-blue-500 to-cyan-600",
    document: "from-indigo-500 to-purple-600",
    clock: "from-amber-500 to-orange-600",
  };

  const getTrendStyles = (val) => {
    if (val > 0) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (val < 0) return "text-rose-600 bg-rose-50 border-rose-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  return (
    <div className={`group relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/60 shadow-sm hover:shadow-xl transition-all duration-500 ease-out hover:scale-[1.02] hover:border-gray-300/60 overflow-hidden ${className}`}>
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-50/0 via-indigo-50/0 to-purple-50/0 group-hover:from-blue-50/30 group-hover:via-indigo-50/20 group-hover:to-purple-50/10 transition-all duration-500 ease-out"></div>
      <div className="absolute top-0 right-0 w-16 h-16 bg-linear-to-bl from-blue-500/5 to-transparent rounded-bl-2xl"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            
            {/* Icon and Trend Row */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-3 rounded-xl bg-linear-to-br shadow-lg group-hover:scale-110 transition-transform duration-300 ${iconGradients[iconType] || iconGradients.default}`}>
                <IconComponent size={20} className="text-white" strokeWidth={2} />
              </div>
              
              {trend !== undefined && (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getTrendStyles(trend)}`}>
                  <TrendingUp 
                    size={12} 
                    className={`transition-transform duration-300 ${trend < 0 ? "rotate-180" : ""}`} 
                  />
                  {Math.abs(trend)}%
                </div>
              )}
            </div>

            {/* Main Text */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600 tracking-wide uppercase">
                {title}
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                {value}
              </div>

              {hint && (
                <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Info size={12} className="text-gray-400" />
                  {hint}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default KpiCard;