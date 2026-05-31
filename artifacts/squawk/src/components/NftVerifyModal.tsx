import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, ChevronLeft, ChevronRight, ExternalLink, ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface HeldNft {
  tokenId: number;
  name: string;
  imageUrl: string | null;
}

interface VerifyResult {
  isHolder: boolean;
  count: number;
  nfts: HeldNft[];
}

interface NftVerifyModalProps {
  onClose: () => void;
}

const OPENSEA_COLLECTION_URL = "https://opensea.io/collection/the-10k-squad-350905768";

export default function NftVerifyModal({ onClose }: NftVerifyModalProps) {
  const [, navigate] = useLocation();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(address.trim());

  const handleVerify = async () => {
    const addr = address.trim();
    if (!isValidAddress) {
      setError("Please enter a valid EVM wallet address (0x...)");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    setCarouselIndex(0);
    try {
      const res = await fetch(`/api/nft/verify-wallet?address=${encodeURIComponent(addr)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Verification failed. Please try again.");
      }
      const data: VerifyResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && isValidAddress) handleVerify();
  };

  const handleVisitAsGuest = () => {
    onClose();
    navigate("/home");
  };

  const handleSignUp = () => {
    onClose();
    navigate("/sign-up");
  };

  const nfts = result?.nfts ?? [];
  const visibleNfts = nfts.slice(carouselIndex, carouselIndex + 3);
  const canPrev = carouselIndex > 0;
  const canNext = carouselIndex + 3 < nfts.length;

  return (
    <AnimatePresence>
      <motion.div
        key="verify-backdrop"
        className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="verify-panel"
          className="relative w-full max-w-md mx-auto my-8 rounded-3xl overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "linear-gradient(135deg, rgba(20,10,45,0.98) 0%, rgba(35,15,65,0.98) 100%)",
            border: "1px solid rgba(168,85,247,0.35)",
            boxShadow: "0 0 60px rgba(168,85,247,0.2), 0 0 120px rgba(236,72,153,0.1)",
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-7">
            {/* Header */}
            <div className="text-center mb-7">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(147,51,234,0.2))", border: "1px solid rgba(236,72,153,0.3)" }}>
                <Wallet className="w-8 h-8 text-pink-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Verify Your Wallet</h2>
              <p className="text-white/55 text-sm leading-relaxed">
                Squawk is exclusively for <span className="text-white font-semibold">10K Squad NFT holders</span>.<br/>
                Paste your EVM wallet address to verify your holdings.
              </p>
            </div>

            {/* Input */}
            {!result && (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setError(""); }}
                    onKeyDown={handleKeyDown}
                    placeholder="0x... (your EVM wallet address)"
                    className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition font-mono"
                    autoFocus
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-xs text-center">{error}</p>
                )}

                <button
                  onClick={handleVerify}
                  disabled={loading || !isValidAddress}
                  className="w-full h-12 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01]"
                  style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scanning blockchain…
                    </>
                  ) : (
                    "Verify Holdings"
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-white/30">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <button
                  onClick={handleVisitAsGuest}
                  className="w-full h-11 rounded-2xl font-semibold text-white/60 text-sm border border-white/15 hover:border-white/30 hover:text-white transition-all hover:bg-white/5"
                >
                  👀 Visit as Guest
                </button>
              </div>
            )}

            {/* Result — Holder */}
            {result?.isHolder && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Success banner */}
                <div className="rounded-2xl p-4 text-center"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
                  <ShieldCheck className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <div className="text-green-400 font-black text-lg">You're a Holder! 🎉</div>
                  <div className="text-white/60 text-sm mt-1">
                    You hold <span className="text-white font-bold">{result.count} 10K Squad NFT{result.count !== 1 ? "s" : ""}</span>. Welcome to the squad!
                  </div>
                </div>

                {/* NFT Carousel */}
                {nfts.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 text-center">
                      Your NFTs ({result.count})
                    </div>
                    <div className="relative">
                      <div className="flex gap-2 justify-center">
                        {visibleNfts.map((nft) => (
                          <a
                            key={nft.tokenId}
                            href={`${OPENSEA_COLLECTION_URL}/${nft.tokenId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative flex-1 min-w-0 rounded-2xl overflow-hidden border border-white/10 hover:border-pink-500/40 transition-all"
                            style={{ maxWidth: "110px" }}
                          >
                            <div className="aspect-square bg-white/5 relative">
                              {nft.imageUrl ? (
                                <img
                                  src={nft.imageUrl}
                                  alt={nft.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">🦜</div>
                              )}
                            </div>
                            <div className="p-1.5 text-center">
                              <div className="text-[10px] font-bold text-white/70 truncate">{nft.name}</div>
                            </div>
                          </a>
                        ))}
                        {/* Fill empty slots */}
                        {visibleNfts.length < 3 && [...Array(3 - visibleNfts.length)].map((_, i) => (
                          <div key={i} className="flex-1 min-w-0" style={{ maxWidth: "110px" }} />
                        ))}
                      </div>

                      {/* Carousel controls */}
                      {nfts.length > 3 && (
                        <div className="flex items-center justify-center gap-3 mt-3">
                          <button
                            onClick={() => setCarouselIndex(i => Math.max(0, i - 3))}
                            disabled={!canPrev}
                            className="w-8 h-8 rounded-full flex items-center justify-center border border-white/15 text-white/50 hover:text-white hover:border-white/30 transition-all disabled:opacity-30"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-white/35">
                            {Math.floor(carouselIndex / 3) + 1} / {Math.ceil(nfts.length / 3)}
                          </span>
                          <button
                            onClick={() => setCarouselIndex(i => Math.min(nfts.length - 1, i + 3))}
                            disabled={!canNext}
                            className="w-8 h-8 rounded-full flex items-center justify-center border border-white/15 text-white/50 hover:text-white hover:border-white/30 transition-all disabled:opacity-30"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSignUp}
                  className="w-full h-12 rounded-2xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01]"
                  style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}
                >
                  🚀 Create Your Account
                </button>

                <button
                  onClick={() => { setResult(null); setAddress(""); }}
                  className="w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors py-1"
                >
                  ← Use a different address
                </button>
              </motion.div>
            )}

            {/* Result — Not a holder */}
            {result && !result.isHolder && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="rounded-2xl p-4 text-center"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <ShieldX className="w-10 h-10 text-red-400 mx-auto mb-2" />
                  <div className="text-red-400 font-black text-lg">Not a Holder</div>
                  <div className="text-white/55 text-sm mt-1 leading-relaxed">
                    Sorry, no 10K Squad NFTs found in this wallet.<br/>
                    Get one on OpenSea to join the squad!
                  </div>
                </div>

                <a
                  href={OPENSEA_COLLECTION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-2xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01]"
                  style={{ background: "linear-gradient(135deg, #2081e2, #1868b7)" }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Buy a 10K Squad NFT on OpenSea
                </a>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setResult(null); setError(""); }}
                    className="flex-1 h-11 rounded-2xl font-semibold text-white/60 text-sm border border-white/15 hover:border-white/30 hover:text-white transition-all hover:bg-white/5"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleVisitAsGuest}
                    className="flex-1 h-11 rounded-2xl font-semibold text-white/60 text-sm border border-white/15 hover:border-white/30 hover:text-white transition-all hover:bg-white/5"
                  >
                    👀 Visit as Guest
                  </button>
                </div>

                <button
                  onClick={() => { setResult(null); setAddress(""); }}
                  className="w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors py-1"
                >
                  ← Try a different address
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
