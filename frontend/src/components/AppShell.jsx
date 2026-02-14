/* eslint-disable react-hooks/static-components */
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import { LayoutDashboard, FileText, PlusCircle, Building2, LogOut, ChevronsLeft, Menu, X } from "lucide-react";


const AppShell = () => {
  const navigate = useNavigate();
  const clerk = useClerk();
  const { user } = useUser();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch (error) {
      return false;
    }
  });

  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setCollapsed(false);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sidebar_collapsed", collapsed ? "true" : "false");
    } catch {}
  }, [collapsed]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSideBar = () => setCollapsed(!collapsed);

  //Display Name
  const displayName = (() => {
    if (!user) return "User";
    const name = user.fullName || user.firstName || user.username || "";
    return name.trim() || (user.email || "").split?.("@")?.[0] || "User";
  })();

  const firstName = () => {
    const parts = displayName.split(" ").filter(Boolean);
    return parts.length ? parts[0] : displayName;
  };

  const initials = () => {
    const parts = displayName.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const logout = async () => {
    try {
      await clerk.signOut();
    } catch (error) {
      console.log("Error during sign out:", error);
    }
    navigate("/login");
  };



  /* ----- SidebarLink ----- */
  const SidebarLink = ({ to, icon, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `
        group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 ease-out
        ${collapsed ? "justify-center" : ""}
        ${
          isActive
            ? "bg-linear-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100"
            : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-md"
        }
      `}
      onClick={() => setMobileOpen(false)}
    >
      {({ isActive }) => (
        <>
          <div
            className={`transition-all duration-300 ${
              isActive
                ? "text-blue-600 scale-110"
                : "text-gray-400 group-hover:text-gray-600 group-hover:scale-105"
            }`}
          >
            {icon}
          </div>
          {!collapsed && (
            <span className="flex-1 transition-all duration-300">{children}</span>
          )}
          {!collapsed && isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <div className="lg:flex">
        <aside
          className={`hidden lg:flex flex-col bg-white/80 backdrop-blur-xl border-r border-gray-200/60 transition-all duration-500 ease-in-out fixed top-0 bottom-0 left-0 z-30 ${
            collapsed
              ? "w-20"
              : "w-80"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-transparent pointer-events-none"></div>
          <div className="px-6 py-8 h-full flex flex-col justify-between relative z-10">
            <div>
              <div
                className={`mb-12 flex items-center ${
                  collapsed ? "justify-center" : ""
                }`}
              >
                <Link to="/" className={`inline-flex items-center group transition-all duration-300 ${collapsed ? "flex-col justify-center" : "gap-3"}`}>
                  <div className="relative">
                    <img
                      src={logo}
                      className={`${collapsed ? "h-10 w-10" : "h-12 w-12"} object-contain drop-shadow-sm transition-all duration-300`}
                      alt=""
                    />
                    <div className="absolute inset-0 rounded-lg blur-sm group-hover:blur-md transition-all duration-300" />
                  </div>

                  {!collapsed && (
                    <div className="">
                      <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">InvoiceAI</span>
                    </div>
                  )}
                </Link>

                <button
                  onClick={toggleSideBar}
                  className={`p-1.5 rounded-lg border border-gray-200 bg-white/50 hover:bg-white hover:shadow-md transition-all duration-300 group ${collapsed ? "mt-4 rotate-180" : "ml-auto"}`}
                >
                  <ChevronsLeft className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                </button>
              </div>

              {/* Sidebar Navigation Items */}
              <nav className="space-y-2">
                <SidebarLink to="/app/dashboard" icon={<LayoutDashboard className="w-5 h-5" />}>
                  Dashboard
                </SidebarLink>
                <SidebarLink to="/app/invoices" icon={<FileText className="w-5 h-5" />}>
                  Invoices
                </SidebarLink>
                <SidebarLink to="/app/create-invoice" icon={<PlusCircle className="w-5 h-5" />}>
                  Create Invoice
                </SidebarLink>
                <SidebarLink to="/app/business" icon={<Building2 className="w-5 h-5" />}>
                  Business Profile
                </SidebarLink>
              </nav>
            </div>

            <div className="mt-auto">
              <div
                className={`border-t border-gray-200/60 pt-6 ${
                  collapsed
                    ? "px-1"
                    : "px-2"
                }`}
              >
                {!collapsed ? (
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:shadow-sm transition-all duration-300 group"
                  >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Logout</span>
                  </button>
                ) : (
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center p-3 rounded-xl text-red-600 hover:bg-red-50 hover:shadow-md transition-all duration-300"
                  >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}


              </div>
            </div>
          </div>
        </aside>

        {/* Mobile */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            />
            <div className="absolute inset-y-0 left-0 w-80 bg-white/90 backdrop-blur-xl border-r border-gray-200/60 p-6 overflow-auto transform transition-transform duration-300">
              <div className="mb-8 flex items-center justify-between">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center"
                >
                  <img
                    src={logo}
                    alt="logo"
                    className="h-10 w-10 object-contain"
                  />
                  <span className="font-bold text-xl ml-3 bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    InvoiceAI
                  </span>
                </Link>

                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-white transition-all duration-300"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <nav className="space-y-2">
                <NavLink
                  onClick={() => setMobileOpen(false)}
                  to="/app/dashboard"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-linear-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm"
                    }`
                  }
                >
                  {" "}
                  <LayoutDashboard className="w-5 h-5" /> Dashboard
                </NavLink>
                <NavLink
                  onClick={() => setMobileOpen(false)}
                  to="/app/invoices"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-linear-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm"
                    }`
                  }
                >
                  {" "}
                  <FileText className="w-5 h-5" /> Invoices
                </NavLink>
                <NavLink
                  onClick={() => setMobileOpen(false)}
                  to="/app/create-invoice"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-linear-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm"
                    }`
                  }
                >
                  {" "}
                  <PlusCircle className="w-5 h-5" /> Create Invoice
                </NavLink>
                <NavLink
                  onClick={() => setMobileOpen(false)}
                  to="/app/business"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-linear-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm"
                    }`
                  }
                >
                  {" "}
                  <Building2 className="w-5 h-5" /> Business Profile
                </NavLink>
              </nav>
              <div className="mt-8 border-t border-gray-200/60 pt-6">
                <button
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-300"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </div>
            </div>
          </div>
        )}

{/* Main Content Navbar */}
        <div className={`flex-1 min-w-0 flex flex-col transition-all duration-500 ease-in-out ${collapsed ? "lg:ml-20" : "lg:ml-80"}`}>
          <header
  className={`flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-40 transition-all duration-300 min-h-20 ${
    scrolled
      ? "shadow-sm"
      : "shadow-none"
  }`}
>
  <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
    
    {/* LEFT SIDE */}
    <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto py-3 sm:py-0">
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden inline-flex items-center justify-center p-2 sm:p-3 rounded-xl border border-gray-200 bg-white/50 hover:bg-white hover:shadow-md transition-all duration-300"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>



        <div className="flex flex-col">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back,{" "}
            <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {firstName()}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
            Ready to create amazing invoices?
          </p>
        </div>
      </div>
    </div>

    {/* RIGHT SIDE */}
    <div className="flex items-center gap-4">
      
      {/* Create Button */}
      <button
        className="group inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 text-sm sm:text-base flex-1 sm:flex-none justify-center"
        onClick={() => navigate("/app/create-invoice")}
      >
        <PlusCircle className="w-4 h-4 text-white" />
        <span className="hidden sm:inline">Create</span>
      </button>

      {/* User Avatar */}
      <div className="relative">
        <button
          onClick={() => clerk.openUserProfile()}
          className="relative w-12 h-12 rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px]"
        >
          <div className="w-full h-full rounded-2xl overflow-hidden bg-white">
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                {initials()}
              </div>
            )}
          </div>
          
          {/* Hover overlay/border effect */}
          <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300" />
        </button>
        
        {/* Status Indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm pointer-events-none" />
      </div>

    </div>
  </div>
</header>


          <main className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Outlet/>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
