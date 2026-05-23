import React, { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser, AuthenticateWithRedirectCallback } from '@clerk/react';
import { useSignIn, useSignUp } from '@clerk/react/legacy';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe } from "@workspace/api-client-react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { CallProvider } from "@/contexts/CallContext";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "./components/SplashScreen";

import { lazy, Suspense } from "react";
import AppLayout from "./components/layout/AppLayout";

// Eagerly loaded — needed immediately on first paint
import LandingPage from "./pages/LandingPage";
import OnboardingPage from "./pages/OnboardingPage";

// Lazily loaded — only fetched after auth, reducing initial bundle size
const HomePage = lazy(() => import("./pages/HomePage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const ReelsPage = lazy(() => import("./pages/ReelsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PostPage = lazy(() => import("./pages/PostPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const ChirpsPage = lazy(() => import("./pages/ChirpsPage"));
const PromoVideoPage = lazy(() => import("./pages/PromoVideoPage"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
    </div>
  );
}

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL || undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.png`,
  },
  variables: {
    colorPrimary: "hsl(330, 100%, 71%)",
    colorForeground: "hsl(280, 20%, 97%)",
    colorBackground: "hsl(268, 45%, 7%)",
    colorInputBackground: "hsl(268, 38%, 12%)",
    colorInputText: "hsl(280, 20%, 97%)",
    colorNeutral: "hsl(268, 35%, 14%)",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "1rem",
  },
};

const OAUTH_PROVIDERS = [
  {
    id: "oauth_google",
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: "oauth_discord",
    label: "Discord",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="#5865F2">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
  },
  {
    id: "oauth_x",
    label: "X / Twitter",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
] as const;

type OAuthProviderId = typeof OAUTH_PROVIDERS[number]["id"];

function OAuthSection({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [loadingProvider, setLoadingProvider] = useState<OAuthProviderId | null>(null);
  const [oauthError, setOAuthError] = useState("");

  const handleOAuth = async (providerId: OAuthProviderId) => {
    setLoadingProvider(providerId);
    setOAuthError("");
    const redirectUrl = `${window.location.origin}${basePath}/sso-callback`;
    const redirectUrlComplete = `${window.location.origin}${basePath}/home`;
    try {
      if (mode === "sign-in") {
        await signIn?.authenticateWithRedirect({ strategy: providerId, redirectUrl, redirectUrlComplete });
      } else {
        await signUp?.authenticateWithRedirect({ strategy: providerId, redirectUrl, redirectUrlComplete, unsafeMetadata: {} });
      }
    } catch (err: any) {
      setOAuthError(err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? "OAuth sign-in failed. Make sure the provider is enabled in your Clerk dashboard.");
      setLoadingProvider(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center gap-3 mt-2">
        {OAUTH_PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => handleOAuth(p.id)}
            disabled={loadingProvider !== null}
            title={`Continue with ${p.label}`}
            className="flex items-center justify-center w-12 h-12 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingProvider === p.id ? (
              <span className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            ) : (
              p.icon
            )}
          </button>
        ))}
      </div>
      {oauthError && <p className="text-xs text-red-400 mt-2 text-center">{oauthError}</p>}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or continue with email</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    </>
  );
}

function SsoCallbackPage() {
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center dark">
      <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      <AuthenticateWithRedirectCallback />
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition";
const btnCls = "w-full h-10 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
const gradientBg = { background: "linear-gradient(135deg, #ec4899, #9333ea)" };

function AuthCard({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card shadow-2xl p-8">
      <div className="flex justify-center mb-5">
        <img src={`${basePath || ""}/logo.png`} alt="Squawk" className="h-14 w-auto" />
      </div>
      <h1 className="text-xl font-bold text-foreground text-center mb-1">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground text-center mb-6">{subtitle}</p>}
      {children}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-400 mt-1 text-center">{msg}</p>;
}

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);
}

function EmailSignUpForm() {
  const { signUp, setActive } = useSignUp();
  const [step, setStep] = useState<"details" | "verify">("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setLoading(true);
    setError("");
    try {
      const created = await withTimeout(
        signUp.create({ firstName, lastName, emailAddress: email, password }),
        25000,
        "Request timed out. Please check your connection and try again.",
      );
      if (created.status === "complete") {
        await setActive!({ session: created.createdSessionId });
        window.location.href = `${window.location.origin}${basePath}/home`;
        return;
      }
      await withTimeout(
        signUp.prepareEmailAddressVerification({ strategy: "email_code" }),
        15000,
        "Could not send verification email. Please try again.",
      );
      setStep("verify");
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? err?.message ?? "Sign up failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setLoading(true);
    setError("");
    try {
      const result = await withTimeout(
        signUp.attemptEmailAddressVerification({ code }),
        15000,
        "Verification timed out. Please try again.",
      );
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        window.location.href = `${window.location.origin}${basePath}/home`;
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? err?.message ?? "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Clerk bot-protection widget — must stay mounted throughout the entire sign-up flow */}
      <div id="clerk-captcha" style={{ marginBottom: 0 }} />

      {step === "verify" ? (
        <AuthCard title="Check your email" subtitle={`We sent a 6-digit code to ${email}`}>
          <form onSubmit={handleVerify} className="flex flex-col gap-3 mt-4">
            <input
              className={inputCls}
              placeholder="Enter verification code"
              value={code}
              onChange={e => setCode(e.target.value)}
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
            />
            <ErrorMsg msg={error} />
            <button type="submit" disabled={loading || code.length < 6} style={gradientBg} className={btnCls}>
              {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : "Verify email"}
            </button>
            <button type="button" onClick={() => { setStep("details"); setError(""); setCode(""); }} className="text-xs text-muted-foreground hover:text-foreground text-center mt-1 transition">
              ← Back
            </button>
          </form>
        </AuthCard>
      ) : (
        <AuthCard title="Create your account" subtitle="Join the 10K Squad community">
          <OAuthSection mode="sign-up" />
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input className={inputCls} placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" required />
              <input className={inputCls} placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" required />
            </div>
            <input className={inputCls} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
            <input className={inputCls} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
            <ErrorMsg msg={error} />
            <button type="submit" disabled={loading} style={gradientBg} className={`${btnCls} mt-1`}>
              {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : "Continue"}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Already have an account?{" "}
              <a href={`${basePath}/sign-in`} className="text-primary hover:underline">Sign in</a>
            </p>
          </form>
        </AuthCard>
      )}
    </>
  );
}

function EmailSignInForm() {
  const { signIn, setActive } = useSignIn();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        window.location.href = `${window.location.origin}${basePath}/home`;
      } else {
        setError("Sign in incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? err?.errors?.[0]?.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your Squawk account">
      <OAuthSection mode="sign-in" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input className={inputCls} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required autoFocus />
        <input className={inputCls} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
        <ErrorMsg msg={error} />
        <button type="submit" disabled={loading} style={gradientBg} className={`${btnCls} mt-1`}>
          {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : "Sign in"}
        </button>
        <p className="text-xs text-muted-foreground text-center mt-1">
          Don't have an account?{" "}
          <a href={`${basePath}/sign-up`} className="text-primary hover:underline">Sign up</a>
        </p>
      </form>
    </AuthCard>
  );
}

function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden dark">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[55%] h-[55%] rounded-full bg-primary/15 blur-[130px]" />
        <div className="absolute bottom-0 -right-[10%] w-[50%] h-[50%] rounded-full bg-secondary/15 blur-[120px]" />
      </div>
      <div className="relative z-10 w-full flex flex-col items-center gap-3">
        {children}
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthPageShell>
      <SignIn
        routing="virtual"
        appearance={clerkAppearance}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/home`}
      />
    </AuthPageShell>
  );
}

function SignUpPage() {
  return (
    <AuthPageShell>
      <SignUp
        routing="virtual"
        appearance={clerkAppearance}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/home`}
      />
    </AuthPageShell>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const { data: me, isLoading, error, refetch } = useGetMe({ query: { enabled: !!isSignedIn, retry: false } });

  // Still initialising Clerk or waiting for the first /api/users/me response
  if (!isLoaded || (isSignedIn && isLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  // No profile yet → onboarding
  if (isSignedIn && error && (error as any)?.status === 404) {
    return <OnboardingPage />;
  }

  // Server/DB error (503 / 500) → show a retry screen instead of a blank page
  if (isSignedIn && error && (error as any)?.status !== 404) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4 text-center dark">
        <div className="text-4xl">🦜</div>
        <h2 className="text-xl font-bold text-foreground">Connection hiccup</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Couldn't reach the server. Check your connection and try again.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-6 py-2.5 rounded-full font-semibold text-white text-sm"
          style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/home" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component, ...rest }: any) {
  return (
    <Route {...rest}>
      <Show when="signed-in">
        <AuthGuard>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <Component />
            </Suspense>
          </AppLayout>
        </AuthGuard>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/sso-callback" component={SsoCallbackPage} />
      
      <ProtectedRoute path="/home" component={HomePage} />
      <ProtectedRoute path="/explore" component={ExplorePage} />
      <ProtectedRoute path="/explore/hashtags/:tag" component={ExplorePage} />
      <ProtectedRoute path="/reels" component={ReelsPage} />
      <ProtectedRoute path="/chirps" component={ChirpsPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/upload" component={UploadPage} />
      <ProtectedRoute path="/profile/:username" component={ProfilePage} />
      <ProtectedRoute path="/post/:id" component={PostPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/edit-profile" component={EditProfilePage} />

      <Route path="/promo">
        <Suspense fallback={<PageLoader />}>
          <PromoVideoPage />
        </Suspense>
      </Route>
      
      <Route>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">This page lost signal.</p>
          <a href="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">
            Return to Grid
          </a>
        </div>
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <SocketProvider>
          <CallProvider>
            <Router />
          </CallProvider>
        </SocketProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <ThemeProvider>
      <TooltipProvider>
        <AnimatePresence>
          {!splashDone && (
            <SplashScreen key="splash" onComplete={() => setSplashDone(true)} />
          )}
        </AnimatePresence>
        {splashDone && (
          <WouterRouter base={basePath}>
            <ClerkProviderWithRoutes />
          </WouterRouter>
        )}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
