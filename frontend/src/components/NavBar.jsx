
/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useRef, useState } from "react";
import logo from "../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { SignedOut, useAuth, useClerk, useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";

const NavBar = () => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const clerk = useClerk();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const TOKEN_KEY = "token";

  // Scroll effect for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Token Generation
  const fetchAndStoreToken = useCallback(async () => {
    try {
        if (!getToken) {
            return null;
        }
        const token = await getToken().catch(()=>null)
        if (token) {
            try {
                localStorage.setItem(TOKEN_KEY , token)
                console.log(token)
            } catch (error) {
                toast.error("Error")
            }
            return token;
        }
        else{
            return null;
        }
    } catch (error) {
        toast.error("Token not")
        return null;
    }
  }, [getToken])


  //keep the local storage in sync with clerk auth state
useEffect(() => {
    let mounted = true;

    // 1. Added the "()" at the very end to run the function
    (async () => {
        if (isSignedIn) {
            // 2. Fixed typo: "templare" -> "template"
            const t = await fetchAndStoreToken({ template: "default" }).catch(() => null);
            
            // Check if component is still mounted before proceeding
            if (!t && mounted) {
                await fetchAndStoreToken({ forceRefresh: true }).catch(() => null);
            }
        } else {
            try {
                localStorage.removeItem(TOKEN_KEY);
            } catch (e) {}
        }
    })(); // <--- CRITICAL FIX HERE

    return () => {
        mounted = false;
    };

// 3. Added isSignedIn to dependency array so it runs when auth state changes
}, [isSignedIn , user , fetchAndStoreToken]);


useEffect(()=>{
    if (isSignedIn) {
        const pathname = window.location.pathname || "/"
        if (
            pathname === "/login" ||
            pathname === "/signup" ||
            pathname.startsWith("/auth") ||
            pathname === "/"
        ) {
            navigate("/app/dashboard" , {replace : true})
        }
    }
})

// Close profile popover on outside click
useEffect(() => {
  function onDocClick(e) {
    if (!profileRef.current) return;
    if (!profileRef.current.contains(e.target)) {
      setProfileOpen(false);
    }
  }
  if (profileOpen) {
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
  }
  return () => {
    document.removeEventListener("mousedown", onDocClick);
    document.removeEventListener("touchstart", onDocClick);
  };
}, [profileOpen]);


  function openSignIn() {
    try {
      if (clerk && typeof clerk.openSignIn === "function") {
        clerk.openSignIn();
      } else {
        navigate("/login");
      }
    } catch (error) {
      toast.error("Error in Sign in");
      console.log(error);
      navigate("/login");
    }
  }

  function openSignUp() {
    try {
      if (clerk && typeof clerk.openSignUp === "function") {
        clerk.openSignUp();
      } else {
        navigate("/signup");
      }
    } catch (error) {
      toast.error("Error in Sign up");
      console.log(error);
      navigate("/signup");
    }
  }

  return (
    <header className={`fixed w-full z-50 transition-all duration-500 ${
      scrolled 
        ? "bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-lg" 
        : "bg-white/70 backdrop-blur-md border-b border-gray-100/50"
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex items-center justify-between h-18">
          <div className="flex items-center gap-6">
            <Link to="/" className="group inline-flex items-center gap-2 transition-transform duration-300 hover:scale-105">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                <img src={logo} alt="logo" className="relative h-11 w-11 object-contain" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">Invoice AI</span>
            </Link>

            <div className="hidden md:flex items-center space-x-8 ml-4">
              <a href="#features" className="group relative text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors duration-300">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#pricing" className="group relative text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors duration-300">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <SignedOut>
                <button
                  onClick={openSignIn}
                  className="group relative text-sm font-semibold text-gray-700 hover:text-gray-900 transition-all duration-300 px-5 py-2.5 rounded-xl hover:bg-gray-100/80 backdrop-blur-sm"
                  type="button"
                >
                  <span className="relative">Sign In</span>
                </button>
                <button
                  onClick={openSignUp}
                  className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <span className="relative">Get Started</span>
                  <svg
                    className="w-4 h-4 relative group-hover:translate-x-1 transition-transform duration-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                </button>
              </SignedOut>
            </div>

            {/* Enhanced Mobile toggle */}
            <button 
              onClick={()=> setOpen(!open)} 
              className="md:hidden relative p-3 rounded-xl bg-white/90 backdrop-blur-md border border-gray-200/70 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group"
            >
                <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ${open ? "rotate-45 translate-y-0" : "-translate-y-1.5"}`}>
                </span>

                <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ${open ? "opacity-0" : "opacity-100"}`}>
                </span>

                <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ${open ? "-rotate-45 translate-y-0" : "translate-y-1.5"}`}>
                </span>
            </button>
          </div>
        </nav>
      </div>

      {/* Enhanced Mobile menu */}
      <div className={`${open ? "block" : "hidden"} md:hidden border-t border-gray-200/60 bg-white/95 backdrop-blur-xl`}>
        <div className="px-6 py-6 space-y-4">
            <a 
              href="#features" 
              onClick={() => setOpen(false)}
              className="block text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-300 py-2"
            >
              Features
            </a>
            <a 
              href="#pricing" 
              onClick={() => setOpen(false)}
              className="block text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-300 py-2"
            >
              Pricing
            </a>
            <div className="pt-3 space-y-3 border-t border-gray-200/60">
                <SignedOut>
                    <button 
                      onClick={openSignIn} 
                      className="block text-gray-700 font-semibold py-2.5 w-full text-left hover:text-indigo-600 transition-colors duration-300"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={openSignUp} 
                      className="block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-center w-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      Get Started
                    </button>
                </SignedOut>
            </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
