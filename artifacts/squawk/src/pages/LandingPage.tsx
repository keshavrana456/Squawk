import { Link } from "wouter";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-hidden flex flex-col relative dark">
      {/* Abstract Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/15 blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-primary/8 blur-[100px]" />
      </div>

      <nav className="w-full flex items-center justify-between p-6 md:px-12 relative z-10">
        <div className="flex items-center gap-3">
          <img src={import.meta.env.BASE_URL.replace(/\/$/, "") + "/logo.png"} alt="Squawk Logo" className="h-10 w-auto" />
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in" className="px-6 py-2 rounded-full font-medium text-foreground hover:bg-white/5 transition-colors" data-testid="link-login">
            Log In
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-8 text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            The new social grid is live
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 leading-tight">
            Culture at <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-[#c084fc]">
              light speed.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto font-light">
            Squawk is where creators, communities, and culture collide. 
            Fast, beautiful, and alive. Connect with the grid.
          </p>

          <Link href="/sign-up">
            <button className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(124,58,237,0.3)]" data-testid="button-get-started">
              <span className="relative z-10 flex items-center gap-2 text-lg">
                Enter the Grid
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
              <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-primary to-[#c084fc] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
          </Link>
        </motion.div>
      </main>
      
      <div className="h-24" />
    </div>
  );
}
