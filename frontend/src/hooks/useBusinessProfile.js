import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axiosConfig.js";
import { resolveImageUrl } from "../utils/imageUrl.js";

const STORAGE_KEY = "business_profile_v2";

function readJSON(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, val) {
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore storage errors
  }
}

function clearKey(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function normalizeProfile(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const businessName = raw.businessName ?? "";
  const email = raw.email ?? "";
  const address = raw.address ?? "";
  const phone = raw.phone ?? "";
  const gst = raw.gst ?? "";

  const logoUrl = raw.logoUrl ?? raw.logoDataUrl ?? null;
  const stampUrl = raw.stampUrl ?? raw.stampDataUrl ?? null;
  const signatureUrl = raw.signatureUrl ?? raw.signatureDataUrl ?? null;

  const signatureOwnerName = raw.signatureOwnerName ?? "";
  const signatureOwnerTitle = raw.signatureOwnerTitle ?? "";
  const defaultTaxPercent =
    raw.defaultTaxPercent !== undefined ? Number(raw.defaultTaxPercent) : 18;

  const profileId = raw._id ?? raw.id ?? null;
  const notes = raw.notes ?? "";

  return {
    businessName,
    email,
    address,
    phone,
    gst,
    logoUrl,
    stampUrl,
    signatureUrl,
    logoDisplayUrl: resolveImageUrl(logoUrl),
    stampDisplayUrl: resolveImageUrl(stampUrl),
    signatureDisplayUrl: resolveImageUrl(signatureUrl),
    signatureOwnerName,
    signatureOwnerTitle,
    defaultTaxPercent,
    notes,
    profileId,
  };
}

export function useBusinessProfile() {
  const { isSignedIn, isLoaded } = useAuth();
  const [profile, setProfileState] = useState(() =>
    typeof window !== "undefined"
      ? readJSON(STORAGE_KEY, null)
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setProfile = useCallback((next) => {
    setProfileState(next);
    if (next) writeJSON(STORAGE_KEY, next);
    else clearKey(STORAGE_KEY);
  }, []);

  const refresh = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/businessProfile/me");
      const data = res.data?.data ?? res.data ?? null;
      if (!data) {
        setProfile(null);
        return;
      }
      const normalized = normalizeProfile(data);
      setProfile(normalized);
    } catch (err) {
      if (err?.status !== 401) {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, setProfile]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    // Always refresh from backend when auth state is ready
    refresh();
  }, [isLoaded, isSignedIn, refresh]);

  return {
    profile,
    loading,
    error,
    refresh,
    setProfile,
  };
}

