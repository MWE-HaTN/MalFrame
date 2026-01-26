import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Globe, SlidersHorizontal, Sun, Moon, User, Github, Save, ExternalLink, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActivityTracker } from "@/components/ActivityTracker";

import { STORAGE_KEYS } from "@/lib/storageKeys";

const SCALE_OPTIONS = [75, 90, 100, 110, 125, 150, 175, 200];
export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { profile, setProfile } = useUser();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const [tempGithub, setTempGithub] = useState(profile.githubUrl);
  const [scale, setScale] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DISPLAY_SCALE);
    return saved ? parseInt(saved, 10) : 100;
  });

  // Title is managed by useSEO hook

  useEffect(() => {
    document.documentElement.style.fontSize = `${scale}%`;
    localStorage.setItem(STORAGE_KEYS.DISPLAY_SCALE, scale.toString());
  }, [scale]);

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    toast.success(`${t("settings.displayScale")}: ${newScale}%`);
  };

  const handleLanguageChange = (newLang: "en" | "vn") => {
    setLanguage(newLang);
    toast.success(newLang === "en" ? "Language changed to English" : "Ngôn ngữ đã chuyển sang Tiếng Việt");
  };

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    toast.success(newTheme === "dark" ? t("settings.themeDark") : t("settings.themeLight"));
  };

  const handleSaveProfile = () => {
    setProfile({
      name: tempName,
      githubUrl: tempGithub,
    });
    setIsEditingProfile(false);
    toast.success(t("settings.profileSaved"));
  };

  const handleCancelEdit = () => {
    setTempName(profile.name);
    setTempGithub(profile.githubUrl);
    setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen bg-background cyber-grid flex flex-col">
      <Header />
      
      <main className="container max-w-7xl mx-auto py-6 space-y-6 flex-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("settings.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("settings.subtitle")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* User Profile Setting */}
          <div className="card-cyber p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {t("settings.profile")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.profileDesc")}
                  </p>
                </div>
              </div>
              {!isEditingProfile && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditingProfile(true)}
                  className="gap-1"
                >
                  <Pencil className="w-3 h-3" />
                  {t("settings.edit")}
                </Button>
              )}
            </div>
            
            {isEditingProfile ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label htmlFor="profile-name" className="text-sm font-medium text-foreground">
                    {t("settings.profileName")}
                  </label>
                  <Input
                    id="profile-name"
                    name="profile-name"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile-github" className="text-sm font-medium text-foreground">
                    {t("settings.profileGithub")}
                  </label>
                  <Input
                    id="profile-github"
                    name="profile-github"
                    value={tempGithub}
                    onChange={(e) => setTempGithub(e.target.value)}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveProfile} size="sm" className="gap-1">
                    <Save className="w-4 h-4" />
                    {t("common.save")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} className="gap-1">
                    <X className="w-4 h-4" />
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("settings.profileName")}</label>
                  <div className="text-sm font-mono text-primary">{profile.name}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("settings.profileGithub")}</label>
                  {profile.githubUrl ? (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-primary hover:underline flex items-center gap-1"
                    >
                      <Github className="w-4 h-4" />
                      <span className="truncate">{profile.githubUrl.replace('https://github.com/', '')}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Language Setting */}
          <div className="card-cyber p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {t("settings.language")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("settings.languageDesc")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleLanguageChange("en")}
                className={`flex-1 px-4 py-2 rounded-sm font-mono text-sm uppercase tracking-wide transition-all ${
                  language === "en"
                    ? "bg-primary text-primary-foreground"
                    : "bg-input border border-border text-foreground hover:border-primary/50"
                }`}
              >
                English
              </button>
              <button
                onClick={() => handleLanguageChange("vn")}
                className={`flex-1 px-4 py-2 rounded-sm font-mono text-sm uppercase tracking-wide transition-all ${
                  language === "vn"
                    ? "bg-primary text-primary-foreground"
                    : "bg-input border border-border text-foreground hover:border-primary/50"
                }`}
              >
                Tiếng Việt
              </button>
            </div>
          </div>

          {/* Display Scale */}
          <div className="card-cyber p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {t("settings.displayScale")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.displayScaleDesc")}
                  </p>
                </div>
              </div>
              {scale !== 100 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleScaleChange(100)}
                  className="font-mono text-xs"
                >
                  {t("settings.restoreScale")}
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                {SCALE_OPTIONS.map((val) => (
                  <span 
                    key={val}
                    className={`cursor-pointer transition-colors ${
                      val === 100 
                        ? scale === val 
                          ? 'text-primary font-semibold underline underline-offset-4' 
                          : 'text-foreground hover:text-primary underline underline-offset-4'
                        : scale === val 
                          ? 'text-primary font-semibold' 
                          : 'hover:text-foreground'
                    }`}
                    onClick={() => handleScaleChange(val)}
                  >
                    {val}%
                  </span>
                ))}
              </div>
              {/* Custom thin track with dots */}
              <div className="relative h-4 flex items-center">
                {/* Track line */}
                <div className="absolute inset-x-0 h-0.5 bg-border rounded-full" />
                {/* Dots */}
                <div className="relative w-full flex justify-between">
                  {SCALE_OPTIONS.map((val) => (
                    <button
                      key={val}
                      onClick={() => handleScaleChange(val)}
                      className={`relative z-10 rounded-full transition-all ${
                        scale === val 
                          ? 'w-3 h-3 bg-primary border-2 border-primary shadow-[0_0_8px_hsl(var(--primary))]' 
                          : 'w-2 h-2 bg-muted-foreground/50 hover:bg-primary/70'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Theme Setting */}
          <div className="card-cyber p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {theme === "dark" ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {t("settings.theme")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("settings.themeDesc")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex-1 px-4 py-2 rounded-sm font-mono text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${
                  theme === "dark"
                    ? "bg-primary text-primary-foreground"
                    : "bg-input border border-border text-foreground hover:border-primary/50"
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex-1 px-4 py-2 rounded-sm font-mono text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${
                  theme === "light"
                    ? "bg-primary text-primary-foreground"
                    : "bg-input border border-border text-foreground hover:border-primary/50"
                }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
            </div>
          </div>
        </div>

        {/* Activity Tracker */}
        <ActivityTracker />
      </main>

      {/* About - Fixed at bottom */}
      <footer className="container max-w-7xl mx-auto pb-6">
        <div className="card-cyber p-6">
          <h3 className="font-semibold text-foreground mb-4">
            {t("settings.about")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("settings.aboutDesc")}
          </p>
        </div>
      </footer>
    </div>
  );
}
