/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Upload, Image, Trash2, Save, RotateCcw, Building2, PenTool, User } from "lucide-react";
import api from "../api/axiosConfig.js";
import { resolveImageUrl } from "../utils/imageUrl.js";

const BusinessProfile = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  const [meta, setMeta] = useState({});
  const [saving, setSaving] = useState(false);

  const [files, setFiles] = useState({
    logo: null,
    stamp: null,
    signature: null,
  });
  const [previews, setPreviews] = useState({
    logo: null,
    stamp: null,
    signature: null,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      if (!isLoaded || !isSignedIn) return;
      try {
        const res = await api.get("/api/businessProfile/me");
        const data = res.data?.data ?? res.data;
        if (!data || !mounted) return;

        const serverMeta = {
          businessName: data.businessName ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          gst: data.gst ?? "",
          logoUrl: data.logoUrl ?? null,
          stampUrl: data.stampUrl ?? null,
          signatureUrl: data.signatureUrl ?? null,
          signatureOwnerName: data.signatureOwnerName ?? "",
          signatureOwnerTitle: data.signatureOwnerTitle ?? "",
          defaultTaxPercent: data.defaultTaxPercent ?? 18,
          notes: data.notes ?? "",
          profileId: data._id ?? data.id ?? null,
        };

        setMeta(serverMeta);
        setPreviews((p) => ({
          ...p,
          logo: resolveImageUrl(serverMeta.logoUrl),
          stamp: resolveImageUrl(serverMeta.stampUrl),
          signature: resolveImageUrl(serverMeta.signatureUrl),
        }));
      } catch (err) {
        if (err?.status !== 401) {
          console.error("Error fetching business profile:", err);
        }
      }
    }

    fetchProfile();

    return () => {
      mounted = false;
      Object.values(previews).forEach((u) => {
        if (u && typeof u === "string" && u.startsWith("blob:")) {
          URL.revokeObjectURL(u);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isLoaded]);

  function updateMeta(field, value) {
    setMeta((m) => ({ ...m, [field]: value }));
  }

  //   File handling for logo stamp and signature
  function handleLocalFilePick(kind, file) {
    if (!file) return;
    // revoke previous object URL if we created it
    const prev = previews[kind];
    if (prev && typeof prev === "string" && prev.startsWith("blob:")) {
      URL.revokeObjectURL(prev);
    }

    const objUrl = URL.createObjectURL(file);
    setFiles((f) => ({ ...f, [kind]: file }));
    setPreviews((p) => ({ ...p, [kind]: objUrl }));
    updateMeta(
      kind === "logo"
        ? "logoUrl"
        : kind === "stamp"
          ? "stampUrl"
          : "signatureUrl",
      objUrl,
    );
  }

  //   You can remove the preview
  function removeLocalFile(kind) {
    const prev = previews[kind];
    if (prev && typeof prev === "string" && prev.startsWith("blob:")) {
      URL.revokeObjectURL(prev);
    }
    setFiles((f) => ({ ...f, [kind]: null }));
    setPreviews((p) => ({ ...p, [kind]: null }));
    updateMeta(
      kind === "logo"
        ? "logoUrl"
        : kind === "stamp"
          ? "stampUrl"
          : "signatureUrl",
      null,
    );
  }

  async function handleSave(e) {
    e?.preventDefault();
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("businessName", meta.businessName || "");
      fd.append("email", meta.email || "");
      fd.append("address", meta.address || "");
      fd.append("phone", meta.phone || "");
      fd.append("gst", meta.gst || "");
      fd.append("defaultTaxPercent", String(meta.defaultTaxPercent ?? 18));
      fd.append("signatureOwnerName", meta.signatureOwnerName || "");
      fd.append("signatureOwnerTitle", meta.signatureOwnerTitle || "");
      fd.append("notes", meta.notes || "");

      if (files.logo) fd.append("logoName", files.logo);
      else if (meta.logoUrl) fd.append("logoUrl", meta.logoUrl);

      if (files.stamp) fd.append("stampName", files.stamp);
      else if (meta.stampUrl) fd.append("stampUrl", meta.stampUrl);

      if (files.signature) fd.append("signatureNameMeta", files.signature);
      else if (meta.signatureUrl) fd.append("signatureUrl", meta.signatureUrl);

      const profileId = meta.profileId;
      const res = profileId
        ? await api.put(`/api/businessProfile/${profileId}`, fd)
        : await api.post("/api/businessProfile", fd);

      const saved = res.data?.data ?? res.data;
      const merged = {
        ...meta,
        businessName: saved.businessName ?? meta.businessName,
        email: saved.email ?? meta.email,
        address: saved.address ?? meta.address,
        phone: saved.phone ?? meta.phone,
        gst: saved.gst ?? meta.gst,
        logoUrl: saved.logoUrl ?? meta.logoUrl,
        stampUrl: saved.stampUrl ?? meta.stampUrl,
        signatureUrl: saved.signatureUrl ?? meta.signatureUrl,
        signatureOwnerName: saved.signatureOwnerName ?? meta.signatureOwnerName,
        signatureOwnerTitle:
          saved.signatureOwnerTitle ?? meta.signatureOwnerTitle,
        defaultTaxPercent: saved.defaultTaxPercent ?? meta.defaultTaxPercent,
        notes: saved.notes ?? meta.notes,
        profileId: saved._id ?? meta.profileId ?? saved.id ?? meta.profileId,
      };

      setMeta(merged);

      if (saved.logoUrl)
        setPreviews((p) => ({ ...p, logo: resolveImageUrl(saved.logoUrl) }));
      if (saved.stampUrl)
        setPreviews((p) => ({ ...p, stamp: resolveImageUrl(saved.stampUrl) }));
      if (saved.signatureUrl)
        setPreviews((p) => ({
          ...p,
          signature: resolveImageUrl(saved.signatureUrl),
        }));

      alert(`Profile ${profileId ? "updated" : "created"} successfully.`);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert(err?.message || "Failed to save profile. See console for details.");
    } finally {
      setSaving(false);
    }
  }

  //   Remove images
  function handleClearProfile() {
    if (
      !confirm(
        "Clear current profile data? This will remove local changes and previews.",
      )
    )
      return;
    // revoke any object URLs created locally
    Object.values(previews).forEach((u) => {
      if (u && typeof u === "string" && u.startsWith("blob:")) {
        URL.revokeObjectURL(u);
      }
    });
    setMeta({});
    setFiles({ logo: null, stamp: null, signature: null });
    setPreviews({ logo: null, stamp: null, signature: null });
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Business Profile</h1>
        <p className="text-sm text-gray-600">
          Configure your company details, branding assets and invoice defaults
        </p>

        {!isSignedIn && (
          <div className="mt-3 text-yellow-800 bg-yellow-50 px-3 py-2 rounded">
            You are not Signed in. Changes cannot be saved. Please Sign in
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-md bg-indigo-50 text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>

            <h2 className="text-lg font-medium">Bussiness Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={meta.businessName || ""}
                onChange={(e) => updateMeta("businessName", e.target.value)}
                placeholder="Enter your business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={meta.email || ""}
                onChange={(e) => updateMeta("email", e.target.value)}
                placeholder="Enter your business email"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Address
              </label>
              <textarea
                rows={3}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={meta.address || ""}
                onChange={(e) => updateMeta("address", e.target.value)}
                placeholder="Enter your business Address"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={meta.phone || ""}
                onChange={(e) => updateMeta("phone", e.target.value)}
                placeholder="Enter your business phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
              <input
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={meta.gst || ""}
                onChange={(e) => updateMeta("gst", e.target.value)}
                placeholder="Enter your business GST Number"
              />
            </div>
          </div>
        </div>

        {/* Branding and default status */}

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-md bg-emerald-50 text-emerald-600">
              <Image className="h-5 w-5" />
            </div>

            <h2 className="text-lg font-medium">Branding and Default</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Company Logo</h3>

                <div className="border border-dashed rounded p-4">
                  {previews.logo ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="w-40 h-24 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                        <img
                          src={previews.logo}
                          alt="logo preview"
                          className="object-contain w-full h-full"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            console.warn(
                              "[BusinessProfile] logo preview failed to load:",
                              previews.logo,
                            );
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <label className="inline-flex items-center gap-2 px-3 py-1 bg-white border rounded cursor-pointer">
                          <Upload className="w-4 h-4" />
                          Change
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleLocalFilePick("logo", e.target.files?.[0])
                            }
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeLocalFile("logo")}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 border rounded"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="flex items-center gap-4 hover:scale-105 transition-transform p-4">
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium">Upload Logo</p>
                          <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleLocalFilePick("logo", e.target.files?.[0])
                          }
                          className="hidden"
                        />
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Tax  */}

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Setting</h3>

                <div className="bg-white p-4 rounded border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Tax Percentage</label>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      onChange={(e) => updateMeta("defaultTaxPercent" , Number(e.target.value || 0))}
                      value={meta.defaultTaxPercent ?? 18}
                      className="w-28 border rounded px-2 py-1"
                    />

                    <span className="text-sm">%</span>
                  </div>

                  <p className="text-sm text-gray-500 mt-2">This tax rate will prefill in new invoices. You can adjust it per invoice as needed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Stamp and Signature */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-md bg-yellow-50 text-yellow-600">
              <PenTool className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-medium">Digital Assets</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stamp */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Digital Stamp</h3>
              <div className="border border-dashed rounded p-4">
                {previews.stamp ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="w-40 h-24 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                      <img
                        src={previews.stamp}
                        alt="stamp preview"
                        className="object-contain w-full h-full"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          console.warn(
                            "[BusinessProfile] stamp preview failed to load:",
                            previews.stamp
                          );
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-1 bg-white border rounded cursor-pointer">
                        <Upload className="w-4 h-4" /> Change
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleLocalFilePick("stamp", e.target.files?.[0])
                          }
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeLocalFile("stamp")}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 border rounded"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="flex items-center gap-4 hover:scale-105 transition-transform p-4">
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <Image className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">Upload Stamp</p>
                        <p className="text-sm text-gray-500">PNG with transparent background</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleLocalFilePick("stamp", e.target.files?.[0])
                        }
                        className="hidden"
                      />
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Signature */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Digital Signature</h3>
              <div className="border border-dashed rounded p-4">
                {previews.signature ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="w-40 h-24 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                      <img
                        src={previews.signature}
                        alt="signature preview"
                        className="object-contain w-full h-full"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          console.warn(
                            "[BusinessProfile] signature preview failed to load:",
                            previews.signature
                          );
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-1 bg-white border rounded cursor-pointer">
                        <Upload className="w-4 h-4" /> Change
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleLocalFilePick(
                              "signature",
                              e.target.files?.[0]
                            )
                          }
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeLocalFile("signature")}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 border rounded"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="flex items-center gap-4 hover:scale-105 transition-transform p-4">
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">Upload Signature</p>
                        <p className="text-sm text-gray-500">PNG with transparent background</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleLocalFilePick("signature", e.target.files?.[0])
                        }
                        className="hidden"
                      />
                    </div>
                  </label>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Signature Owner Name</label>
                  <input
                    placeholder="John Doe"
                    value={meta.signatureOwnerName || ""}
                    onChange={(e) =>
                      updateMeta("signatureOwnerName", e.target.value)
                    }
                    className="w-full border rounded px-3 py-2 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Signature Title / Designation</label>
                  <input
                    placeholder="Director / CEO"
                    value={meta.signatureOwnerTitle || ""}
                    onChange={(e) =>
                      updateMeta("signatureOwnerTitle", e.target.value)
                    }
                    className="w-full border rounded px-3 py-2 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}

        <div className="flex justify-end">
          <div className="flex gap-2">
            <button disabled={saving} onClick={handleSave} type="submit" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded">
              <Save className="w-4 h-4"/>
              {saving ? "Saving.." : "Save Profile"}
            </button>

            <button type="button" onClick={handleClearProfile} className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded">
              <RotateCcw className="w-4 h-4"/>Clear Profile
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BusinessProfile;
