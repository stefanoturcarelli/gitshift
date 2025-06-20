import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Profile } from "./types";
import "./App.css";

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [selectedScope, setSelectedScope] = useState<"global" | "local">(
    "global"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadProfiles();
    loadCurrentProfile();
  }, [selectedScope]);

  const loadProfiles = async () => {
    try {
      const profileList = await invoke<Profile[]>("list_profiles");
      setProfiles(profileList);
    } catch (error) {
      console.error("Failed to load profiles:", error);
    }
  };

  const loadCurrentProfile = async () => {
    try {
      const current = await invoke<Profile | null>("get_current_profile", {
        scope: selectedScope,
      });
      setCurrentProfile(current);
    } catch (error) {
      console.error("Failed to get current profile:", error);
      setCurrentProfile(null);
    }
  };

  const switchProfile = async (profile: Profile) => {
    setIsLoading(true);
    setMessage(null);
    try {
      await invoke("switch_profile", { scope: selectedScope, profile });
      setCurrentProfile(profile);
      setMessage({
        type: "success",
        text: `Successfully switched to ${profile.label} profile`,
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      setMessage({ type: "error", text: `Failed to switch profile: ${error}` });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating ambient orbs */}
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>

      <div className="relative z-10 min-h-screen p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header with Mac-style title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-light text-white mb-3 tracking-tight">
              GitShift
            </h1>
            <p className="text-lg text-white/70 font-light">
              Professional Git Profile Manager
            </p>
          </div>

          {/* Main Glass Container */}
          <div className="glass-card glass-transition rounded-3xl p-8 mb-8">
            {/* Scope Selection with Mac-style segmented control */}
            <div className="mb-10">
              <h2 className="text-xl font-medium text-white/90 mb-6 tracking-wide">
                Configuration Scope
              </h2>
              <div className="inline-flex glass-card rounded-2xl p-1.5">
                <button
                  onClick={() => setSelectedScope("global")}
                  className={`px-6 py-3 rounded-xl font-medium text-sm tracking-wide glass-transition ${
                    selectedScope === "global"
                      ? "bg-white/20 text-white shadow-lg backdrop-blur-xl"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  Global
                </button>
                <button
                  onClick={() => setSelectedScope("local")}
                  className={`px-6 py-3 rounded-xl font-medium text-sm tracking-wide glass-transition ${
                    selectedScope === "local"
                      ? "bg-white/20 text-white shadow-lg backdrop-blur-xl"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  Local Repository
                </button>
              </div>
            </div>

            {/* Current Profile Display */}
            {currentProfile && (
              <div className="mb-10 glass-card rounded-2xl p-6 border border-emerald-400/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 status-dot"></div>
                  <h3 className="text-lg font-medium text-emerald-300/90 tracking-wide">
                    Active{" "}
                    {selectedScope.charAt(0).toUpperCase() +
                      selectedScope.slice(1)}{" "}
                    Profile
                  </h3>
                </div>
                <div className="space-y-2 text-white/80">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-300/70 font-medium min-w-16">
                      Name
                    </span>
                    <span className="font-light">{currentProfile.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-300/70 font-medium min-w-16">
                      Email
                    </span>
                    <span className="font-light">{currentProfile.email}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Available Profiles Grid */}
            <div className="mb-8">
              <h2 className="text-xl font-medium text-white/90 mb-8 tracking-wide">
                Available Profiles
              </h2>
              <div className="grid gap-6 lg:grid-cols-2">
                {profiles.map((profile, index) => (
                  <div
                    key={index}
                    className="glass-card glass-transition rounded-2xl p-6 hover:bg-white/12 group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-xl font-medium text-white tracking-wide">
                        {profile.label}
                      </h3>
                      <span className="px-3 py-1.5 bg-white/10 text-white/70 rounded-full text-xs font-medium tracking-wider uppercase">
                        {profile.label.toLowerCase()}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 status-dot"></div>
                        <span className="text-sm text-white/60 font-medium min-w-12">
                          Name
                        </span>
                        <span className="text-sm text-white/80 font-light">
                          {profile.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 status-dot"></div>
                        <span className="text-sm text-white/60 font-medium min-w-12">
                          Email
                        </span>
                        <span className="text-sm text-white/80 font-light">
                          {profile.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 status-dot"></div>
                        <span className="text-sm text-white/60 font-medium min-w-12">
                          SSH
                        </span>
                        <span className="text-xs text-white/60 font-mono truncate">
                          {profile.ssh_key}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => switchProfile(profile)}
                      disabled={isLoading}
                      className="w-full glass-button rounded-xl py-3.5 px-6 text-white font-medium text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed group-hover:bg-white/15"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Switching...
                        </div>
                      ) : (
                        `Switch to ${profile.label}`
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Message with refined styling */}
            {message && (
              <div
                className={`glass-card rounded-2xl p-4 mb-6 border glass-transition ${
                  message.type === "success"
                    ? "border-emerald-400/30 bg-emerald-500/10"
                    : "border-red-400/30 bg-red-500/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full status-dot ${
                      message.type === "success"
                        ? "bg-emerald-400"
                        : "bg-red-400"
                    }`}
                  ></div>
                  <p
                    className={`font-light tracking-wide ${
                      message.type === "success"
                        ? "text-emerald-300"
                        : "text-red-300"
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-8 border-t border-white/10">
              <p className="text-white/50 text-sm font-light tracking-wide">
                Seamless Git profile management with enterprise-grade security
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
