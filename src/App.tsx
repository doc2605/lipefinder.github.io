import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Calendar, RefreshCw, ExternalLink, ShieldCheck, Copy, Check, RotateCcw, Play, Pause } from 'lucide-react';
import * as skinview3d from 'skinview3d';

interface PlayerData {
  username: string;
  uuid: string;
  avatar: string;
  skinUrl: string;
  lastChanged?: string;
}

const SkinViewer3D = ({ skinUrl }: { skinUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<skinview3d.SkinViewer | null>(null);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const viewer = new skinview3d.SkinViewer({
      canvas: canvasRef.current,
      width: 300,
      height: 400,
      skin: skinUrl,
    });

    viewer.autoRotate = true;
    viewer.autoRotateSpeed = 0.5;
    viewer.animation = new skinview3d.WalkingAnimation();
    
    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
    };
  }, [skinUrl]);

  const toggleRotation = () => {
    if (viewerRef.current) {
      viewerRef.current.autoRotate = !viewerRef.current.autoRotate;
      setIsRotating(viewerRef.current.autoRotate);
    }
  };

  const resetCamera = () => {
    if (viewerRef.current) {
      viewerRef.current.controls.reset();
    }
  };

  return (
    <div className="relative group flex flex-col items-center">
      <canvas ref={canvasRef} className="cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={toggleRotation}
          className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full hover:bg-black/80 transition-colors"
          title={isRotating ? "Pausar Rotação" : "Iniciar Rotação"}
        >
          {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={resetCamera}
          className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full hover:bg-black/80 transition-colors"
          title="Resetar Câmera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const UUID = "7e752fb2-ba5f-412c-bd22-be65e07bfc82";

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchPlayerData = async (isAuto: any = false) => {
    const auto = isAuto === true;
    if (!auto) setLoading(true);
    setError(null);
    try {
      // Using minetools.eu for faster data fetching
      const response = await fetch(`https://api.minetools.eu/uuid/${UUID}`);
      const data = await response.json();

      if (data.id) {
        setPlayer({
          username: data.name,
          uuid: data.id,
          avatar: `https://mc-heads.net/avatar/${UUID}/100`,
          skinUrl: `https://mc-heads.net/skin/${UUID}`,
          lastChanged: "Histórico indisponível (API Mojang Restrita)"
        });
        setLastUpdated(new Date());
      } else {
        throw new Error("Jogador não encontrado");
      }
    } catch (err) {
      if (!auto) setError("Erro ao carregar os dados do jogador. Tente novamente mais tarde.");
      console.error(err);
    } finally {
      if (!auto) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchPlayerData(true);
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-24 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            LipeFinder
          </h1>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">
            Acompanhe em tempo real o nome de usuário e a skin atual do Lipe no Minecraft.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
              <p className="text-zinc-500 font-medium animate-pulse">Consultando a Mojang...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center max-w-md"
            >
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchPlayerData}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors font-medium"
              >
                Tentar Novamente
              </button>
            </motion.div>
          ) : player ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full"
            >
              {/* Skin Card */}
              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 flex items-center justify-center relative group overflow-hidden min-h-[450px]">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 drop-shadow-[0_20px_50px_rgba(16,185,129,0.2)]">
                  <SkinViewer3D skinUrl={player.skinUrl} />
                </div>
              </div>

              {/* Info Card */}
              <div className="flex flex-col gap-6">
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-500" />
                      </div>
                      <span className="text-zinc-400 font-medium uppercase tracking-wider text-xs">Nick Atual</span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(player.username, 'nick')}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-white"
                      title="Copiar Nick"
                    >
                      {copiedField === 'nick' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <h2 className="text-5xl font-black tracking-tighter mb-2 text-emerald-400">
                    {player.username}
                  </h2>
                  <div className="flex items-center justify-between group/uuid">
                    <p className="text-zinc-500 font-mono text-sm break-all">
                      {player.uuid}
                    </p>
                    <button 
                      onClick={() => copyToClipboard(player.uuid, 'uuid')}
                      className="p-1 opacity-0 group-hover/uuid:opacity-100 transition-opacity text-zinc-600 hover:text-white"
                      title="Copiar UUID"
                    >
                      {copiedField === 'uuid' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="space-y-4 mt-8">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <Calendar className="w-5 h-5 text-zinc-400" />
                      <div>
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Última Alteração</p>
                        <p className="text-sm text-zinc-300">{player.lastChanged}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <ShieldCheck className="w-5 h-5 text-zinc-400" />
                      <div>
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Status da Conta</p>
                        <p className="text-sm text-zinc-300">Original / Premium</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <a
                    href={`https://namemc.com/profile/${player.uuid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-medium border border-white/5"
                  >
                    Ver no NameMC <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={fetchPlayerData}
                    className="w-16 bg-emerald-500 hover:bg-emerald-600 text-black rounded-2xl flex items-center justify-center transition-all"
                    title="Atualizar"
                  >
                    <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <footer className="mt-20 text-zinc-600 text-sm flex flex-col items-center gap-2">
          <p>© 2026 Qual o Nick do Lipe?</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API Mojang Online
            </span>
            {lastUpdated && (
              <span className="text-zinc-700">
                Atualizado às {lastUpdated.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}
