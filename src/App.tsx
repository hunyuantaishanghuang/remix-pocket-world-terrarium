import React, { useEffect, useRef, useState } from 'react';
import {
  Anchor,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bird,
  Bug,
  Camera,
  Castle,
  Cloud,
  CloudSnow,
  Compass,
  Eraser,
  Fan,
  Flame,
  Flower2,
  Github,
  Home,
  LampFloor,
  Moon,
  Mountain,
  Pencil,
  Play,
  Rainbow,
  Sailboat,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Sun,
  Sunset,
  TowerControl,
  Trees,
  Users,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import { GitHubModal } from './components/GitHubModal';
import { PocketWorldController } from './three/PocketWorldScene';
import {
  CameraViewId,
  TimeMode,
  TOOL_DEFINITIONS,
  ToolCategory,
  ToolId,
  WorldState,
} from './types/world';
import { soundManager } from './utils/audio';

const TOOL_GROUPS: { category: Exclude<ToolCategory, 'all'>; title: string }[] = [
  { category: 'village', title: '村落与地标' },
  { category: 'water', title: '水域与沿海' },
  { category: 'nature', title: '自然与生灵' },
  { category: 'weather', title: '天象与魔法' },
  { category: 'sculpt', title: '塑形与地貌' },
];

function renderToolIcon(id: ToolId) {
  const cls = 'w-4 h-4 shrink-0';
  switch (id) {
    case 'tree':
      return <Trees className={cls} />;
    case 'sakura':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
        >
          <path d="M12 2a4 4 0 0 0-4 4c0 2 2 4 4 6 2-2 4-4 4-6a4 4 0 0 0-4-4z" />
          <path d="M4 12a4 4 0 0 0 4 4c2 0 4-2 6-4-2-2-4-4-6-4a4 4 0 0 0-4 4z" />
          <path d="M20 12a4 4 0 0 1-4 4c-2 0-4-2-6-4 2-2 4-4 6-4a4 4 0 0 1 4 4z" />
          <path d="M12 22a4 4 0 0 0 4-4c0-2-2-4-4-6-2 2-4 4-4 6a4 4 0 0 0 4 4z" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case 'torii':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
        >
          <path d="M2 5c6-2 14-2 20 0" />
          <path d="M4 8h16" />
          <path d="M7 8v13" />
          <path d="M17 8v13" />
          <path d="M11 5v3" />
          <path d="M13 5v3" />
        </svg>
      );
    case 'onsen':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
        >
          <path d="M4 15a8 8 0 0 0 16 0" />
          <path d="M3 15h18" />
          <path d="M8 5c0 2 2 3 2 5" />
          <path d="M12 4c0 2 2 3 2 5" />
          <path d="M16 5c0 2 2 3 2 5" />
        </svg>
      );
    case 'crystal':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
        >
          <path d="M6 3h12l4 7-10 11L2 10l4-7z" />
          <path d="M2 10h20" />
          <path d="M12 21 8 10l4-7 4 7-4 11z" />
        </svg>
      );
    case 'deer':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
        >
          <path d="M7 3v4l4 3v5l-3 6" />
          <path d="M11 15h5l2 6" />
          <path d="M18 15l-1-6-3-2" />
          <path d="M4 3l3 2" />
          <path d="M10 2l-2 3" />
          <circle cx="16" cy="9" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'pavilion':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
        >
          <path d="M12 2l1 2h6l-2 3H7L5 4h6l1-2z" />
          <path d="M6 7v11" />
          <path d="M18 7v11" />
          <path d="M10 7v11" />
          <path d="M14 7v11" />
          <path d="M3 18h18" />
          <path d="M4 21h16" />
        </svg>
      );
    case 'house':
      return <Home className={cls} />;
    case 'windmill':
      return <Fan className={cls} />;
    case 'lighthouse':
      return <TowerControl className={cls} />;
    case 'watchtower':
      return <Castle className={cls} />;
    case 'campfire':
      return <Flame className={cls} />;
    case 'lantern':
      return <LampFloor className={cls} />;
    case 'balloon':
      return <Wind className={cls} />;
    case 'sailboat':
      return <Sailboat className={cls} />;
    case 'dock':
      return <Anchor className={cls} />;
    case 'duck':
      return <Bird className={cls} />;
    case 'mountain':
      return <Mountain className={cls} />;
    case 'lake':
      return <Waves className={cls} />;
    case 'flower':
      return <Flower2 className={cls} />;
    case 'beehive':
      return <Bug className={cls} />;
    case 'cloud':
      return <Cloud className={cls} />;
    case 'snowcloud':
      return <CloudSnow className={cls} />;
    case 'rainbow':
      return <Rainbow className={cls} />;
    case 'shootingstar':
      return <Sparkles className={cls} />;
    case 'villager':
      return <Users className={cls} />;
    case 'sheep':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
          aria-hidden="true"
        >
          <path d="M8 15a4 4 0 0 1-2-7.5 4.5 4.5 0 0 1 8.5-1A3.5 3.5 0 0 1 18 10a3.5 3.5 0 0 1-1 6.8H8Z" />
          <path d="M9 17v3" />
          <path d="M15 17v3" />
        </svg>
      );
    case 'raise':
      return <ArrowUpFromLine className={cls} />;
    case 'lower':
      return <ArrowDownToLine className={cls} />;
    case 'remove':
      return <Eraser className={cls} />;
  }
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<PocketWorldController | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [worldState, setWorldState] = useState<WorldState>({
    planetName: '青绿小草甸',
    population: 12,
    happiness: 96,
    dayCount: 1,
    activeTool: 'tree',
    activeView: 'orb',
    timeMode: 'auto',
    timeOfDay: 0.24,
    tourActive: false,
    tourElapsed: 0,
    tourPhase: '',
    soundEnabled: true,
    objectCounts: {
      houses: 4,
      trees: 22,
      sakura: 2,
      windmills: 1,
      lighthouses: 2,
      villagers: 12,
      sheep: 8,
      deer: 2,
      clouds: 3,
      flowers: 5,
      boats: 3,
      torii: 1,
      onsen: 1,
      crystals: 1,
      pavilions: 1,
    },
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [webglLost, setWebglLost] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(soundManager.isEnabled());

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const controller = new PocketWorldController(container, setWorldState);
    controllerRef.current = controller;

    const canvas = container.querySelector('canvas');
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const onContextRestored = () => {
      setWebglLost(false);
    };

    if (canvas) {
      canvas.addEventListener('webglcontextlost', onContextLost);
      canvas.addEventListener('webglcontextrestored', onContextRestored);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', onContextLost);
        canvas.removeEventListener('webglcontextrestored', onContextRestored);
      }
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!filtersOpen && !githubModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFiltersOpen(false);
        setGithubModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filtersOpen, githubModalOpen]);

  const handleSelectTool = (tool: ToolId) => {
    controllerRef.current?.setTool(tool);
  };

  const handleSelectView = (view: CameraViewId) => {
    controllerRef.current?.stopTour();
    controllerRef.current?.applyCameraPreset(view);
  };

  const handleSelectTimeMode = (mode: TimeMode) => {
    controllerRef.current?.setTimeMode(mode);
  };

  const handleGrow = () => {
    controllerRef.current?.triggerGrowVillage();
  };

  const handleToggleTour = () => {
    setFiltersOpen(false);
    if (worldState.tourActive) {
      controllerRef.current?.stopTour();
    } else {
      controllerRef.current?.startTour();
    }
  };

  const handleToggleSound = () => {
    const next = soundManager.toggle();
    setSoundOn(next);
  };

  const handleCaptureSnapshot = () => {
    if (!controllerRef.current) return;
    const dataUrl = controllerRef.current.captureSnapshot();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `pocket-world-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const orderedTools = TOOL_GROUPS.flatMap((group) =>
    TOOL_DEFINITIONS.filter((t) => t.category === group.category),
  );

  return (
    <div className="flex w-screen h-screen overflow-hidden select-none bg-[#221d2b]">
      {/* 3D Three.js Canvas Viewport */}
      <div className="relative flex-1 min-w-0 h-full">
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          aria-label="3D 微缩生态星球"
        />

        {/* Top Floating Mini Bar: Quick Snapshot, Audio, & GitHub Push */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#faf5ec]/90 backdrop-blur-md rounded-xl border border-[#e2d7c5] shadow-xs text-xs text-[#2b221b]">
            <span className="font-semibold">{worldState.planetName}</span>
            <span className="text-[#8c7d6b]">•</span>
            <span className="text-[#4e6e3a] font-medium font-mono-tabular">
              幸福度 {worldState.happiness}%
            </span>
          </div>

          <button
            type="button"
            onClick={handleCaptureSnapshot}
            title="拍照截图保存"
            className="w-8 h-8 rounded-xl bg-[#faf5ec]/90 backdrop-blur-md border border-[#e2d7c5] text-[#42362b] hover:bg-[#fffdfa] hover:scale-105 active:scale-95 flex items-center justify-center shadow-xs transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleToggleSound}
            title={soundOn ? '关闭治愈音效' : '开启治愈音效'}
            className="w-8 h-8 rounded-xl bg-[#faf5ec]/90 backdrop-blur-md border border-[#e2d7c5] text-[#42362b] hover:bg-[#fffdfa] hover:scale-105 active:scale-95 flex items-center justify-center shadow-xs transition-all cursor-pointer"
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-[#9c8273]" />}
          </button>

          <button
            type="button"
            onClick={() => setGithubModalOpen(true)}
            title="推送到 GitHub / 源码导出"
            className="h-8 px-2.5 rounded-xl bg-[#24292f] text-white hover:bg-[#343a42] hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer text-xs font-medium"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">推送到 GitHub</span>
          </button>
        </div>

        {/* 30s Tour Live Overlay */}
        {worldState.tourActive && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
            <div className="px-5 py-2.5 bg-[#2b221b]/90 backdrop-blur-md border border-white/20 text-[#fcf8f0] rounded-2xl shadow-xl flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold tracking-wide">
                  {worldState.tourPhase || '30秒电影级全景导览中...'}
                </span>
                <span className="text-[10px] text-[#e8dfcf] font-mono-tabular">
                  剩余时间: {Math.max(1, Math.ceil(30.0 - worldState.tourElapsed))} 秒
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleTour}
                className="ml-2 px-2.5 py-1 text-[11px] bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-colors cursor-pointer"
              >
                退出导览
              </button>
            </div>
          </div>
        )}

        {/* WebGL Context Lost Fallback */}
        {webglLost && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#231e2d]/90 text-[#faf6ee]">
            <div className="max-w-md p-6 text-center bg-[#322b3f] rounded-xl border border-white/10">
              <h2 className="text-xl font-semibold mb-2">3D 视口已暂停</h2>
              <p className="text-sm text-[#d6cee2]">
                WebGL 上下文中断，请刷新或切换回标签页以继续探索 {worldState.planetName}。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Desktop Tool Dock */}
      {!worldState.tourActive && (
        <aside
          aria-label="微缩世界工具栏"
          className="hidden md:flex w-16 shrink-0 h-full bg-[#faf5ec] border-l border-[#e2d7c5] text-[#382f27] flex-col items-center py-3 gap-2.5 z-20"
        >
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            title="打开世界控制台与视角设置"
            aria-label="打开控制台"
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-[#382f27] text-[#fcf8f0] border border-[#261f19] hover:bg-[#4d4136] active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
          </button>

          <div className="w-8 h-px bg-[#e2d7c5] shrink-0" aria-hidden="true" />

          <div
            className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto no-scrollbar py-0.5"
            role="toolbar"
            aria-orientation="vertical"
            aria-label="世界建造工具"
          >
            {orderedTools.map((tool) => {
              const isSelected = worldState.activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleSelectTool(tool.id)}
                  title={`${tool.label} - ${tool.description}`}
                  aria-label={tool.label}
                  className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? `${tool.accentBg} ${tool.accentBorder} ${tool.accentText} shadow-xs scale-105`
                      : 'bg-[#f3ede2] border-[#e2d7c5] text-[#54483c] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                  }`}
                >
                  {renderToolIcon(tool.id)}
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* Desktop Modal for Filters (Planet Info, Grow & 30s Tour, Camera View, Lighting & Sky) */}
      {!worldState.tourActive && filtersOpen && (
        <div className="hidden md:flex fixed inset-0 z-40 items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setFiltersOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="世界控制台"
            className="relative z-10 w-full max-w-sm max-h-[85vh] bg-[#faf5ec] text-[#382f27] rounded-2xl border border-[#e2d7c5] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-[#e6dccb] shrink-0">
              <h2 className="text-sm font-semibold text-[#2b221b]">世界控制台</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="关闭控制台"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#594d40] hover:bg-[#eae1d3] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-5 overflow-y-auto">
              {/* 1. Planet Identity & Live Stats */}
              <section className="flex flex-col gap-1.5 pb-3 border-b border-[#e6dccb]">
                <div className="flex items-center justify-between gap-2">
                  {isEditingName ? (
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={worldState.planetName}
                      maxLength={28}
                      onChange={(e) =>
                        setWorldState((prev) => ({
                          ...prev,
                          planetName: e.target.value,
                        }))
                      }
                      onBlur={() => {
                        if (!worldState.planetName.trim()) {
                          setWorldState((prev) => ({
                            ...prev,
                            planetName: '青绿小草甸',
                          }));
                        }
                        setIsEditingName(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          nameInputRef.current?.blur();
                        }
                      }}
                      aria-label="星球名称"
                      className="w-full px-2 py-0.5 text-lg font-semibold bg-[#fffdf9] border border-[#cbbba3] rounded text-[#2b221b] focus:outline-none focus:ring-2 focus:ring-[#a6cfa0]"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="group flex items-center gap-1.5 text-left cursor-pointer focus:outline-none"
                      title="点击重命名星球"
                    >
                      <h3 className="text-lg font-semibold tracking-tight text-[#2b221b] group-hover:text-[#4e6e3a] transition-colors">
                        {worldState.planetName}
                      </h3>
                      <Pencil className="w-3.5 h-3.5 text-[#8c7d6b] opacity-70 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-[#594d40] font-mono-tabular">
                  <span>
                    人口 <strong className="font-semibold text-[#2b221b]">{worldState.population}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    幸福度 <strong className="font-semibold text-[#2e5926]">{worldState.happiness}%</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    历程 <strong className="font-semibold text-[#2b221b]">第 {worldState.dayCount} 天</strong>
                  </span>
                </div>

                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-[#695b4c] font-mono-tabular pt-1">
                  <span>{worldState.objectCounts.houses} 民居</span>
                  <span>·</span>
                  <span>{worldState.objectCounts.trees} 树木</span>
                  <span>·</span>
                  <span>{worldState.objectCounts.sakura} 樱花</span>
                  <span>·</span>
                  <span>{worldState.objectCounts.torii} 鸟居</span>
                  <span>·</span>
                  <span>{worldState.objectCounts.onsen} 温泉</span>
                  <span>·</span>
                  <span>{worldState.objectCounts.pavilions} 凉亭</span>
                  <span>·</span>
                  <span>{worldState.objectCounts.crystals} 晶石</span>
                  <span>·</span>
                  <span>{worldState.objectCounts.deer} 灵鹿</span>
                  <span>·</span>
                  <span>{worldState.objectCounts.sheep} 绵羊</span>
                  <span>·</span>
                  <span>{worldState.objectCounts.boats} 舟船</span>
                  <span>·</span>
                  <span>{worldState.objectCounts.clouds} 云朵</span>
                </div>
              </section>

              {/* 2. Primary Actions: Grow & 30s Tour & Snapshot */}
              <section className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGrow}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#23451e] bg-[#d4ebc8] hover:bg-[#c5e3b5] border border-[#a3cf8e] rounded-xl transition-colors cursor-pointer"
                  title="促进生态茁壮成长，增添民居、花草并让树木成长"
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>繁荣生长</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleTour}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border bg-[#382f27] text-[#fcf8f0] border-[#261f19] hover:bg-[#4d4136] transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>30秒导览</span>
                </button>
              </section>

              {/* 3. Camera Views */}
              <section className="flex flex-col gap-1.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                  相机视角
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'orb', label: '水晶球全景' },
                      { id: 'surface', label: '地表微距' },
                      { id: 'orbit', label: '行星轨道' },
                      { id: 'village', label: '村落特写' },
                    ] as { id: CameraViewId; label: string }[]
                  ).map((v) => {
                    const active =
                      worldState.activeView === v.id && !worldState.tourActive;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectView(v.id)}
                        className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#e3eedc] text-[#23451e] border-[#a6cfa0] shadow-xs'
                            : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 4. Lighting & Time of Day */}
              <section className="flex flex-col gap-1.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                  昼夜光影
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      {
                        id: 'auto',
                        label: '日夜流转',
                        icon: <Compass className="w-3.5 h-3.5" />,
                      },
                      {
                        id: 'day',
                        label: '晴空白昼',
                        icon: <Sun className="w-3.5 h-3.5" />,
                      },
                      {
                        id: 'twilight',
                        label: '暮色黄昏',
                        icon: <Sunset className="w-3.5 h-3.5" />,
                      },
                      {
                        id: 'night',
                        label: '静谧深夜',
                        icon: <Moon className="w-3.5 h-3.5" />,
                      },
                    ] as { id: TimeMode; label: string; icon: React.ReactNode }[]
                  ).map((m) => {
                    const active = worldState.timeMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectTimeMode(m.id)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#e1ecf7] text-[#264669] border-[#a4c2e3] shadow-xs'
                            : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                        }`}
                      >
                        {m.icon}
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 5. Project Actions */}
              <section className="pt-2 border-t border-[#e6dccb] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  className="flex-1 py-2 px-3 text-xs font-medium rounded-xl border border-[#d6c8b4] bg-[#fdfbf7] hover:bg-[#f3ede2] text-[#42362b] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>截图保存</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFiltersOpen(false);
                    setGithubModalOpen(true);
                  }}
                  className="flex-1 py-2 px-3 text-xs font-medium rounded-xl bg-[#24292f] hover:bg-[#3d444d] text-white flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>推送到 GitHub</span>
                </button>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar: Filters Button + Scrollable Row of Tool Buttons */}
      {!worldState.tourActive && (
        <div
          aria-label="移动端工具栏"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#faf5ec]/95 backdrop-blur-md border-t border-[#e2d7c5] px-3 py-2.5 flex items-center gap-2.5"
        >
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="h-11 px-3.5 shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-[#382f27] text-[#fcf8f0] border border-[#261f19] text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
            aria-label="控制台"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>控制台</span>
          </button>

          <div
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 pr-1"
            role="toolbar"
            aria-label="世界建造工具"
          >
            {orderedTools.map((tool) => {
              const isSelected = worldState.activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleSelectTool(tool.id)}
                  title={tool.label}
                  aria-label={tool.label}
                  className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? `${tool.accentBg} ${tool.accentBorder} ${tool.accentText} shadow-xs scale-105`
                      : 'bg-[#f3ede2] border-[#e2d7c5] text-[#54483c] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                  }`}
                >
                  {renderToolIcon(tool.id)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet for Filters */}
      {!worldState.tourActive && filtersOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setFiltersOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="世界控制台"
            className="relative z-10 w-full max-h-[80vh] bg-[#faf5ec] text-[#382f27] rounded-t-3xl border-t border-[#e2d7c5] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="w-10 h-1.5 bg-[#d6c8b4] rounded-full mx-auto mt-3 mb-1 shrink-0" />
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#e6dccb] shrink-0">
              <h2 className="text-sm font-semibold text-[#2b221b]">世界控制台</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="关闭控制台"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#594d40] hover:bg-[#eae1d3] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-5 overflow-y-auto">
              {/* Planet Identity & Stats */}
              <section className="flex flex-col gap-1.5 pb-3 border-b border-[#e6dccb]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-semibold text-[#2b221b]">
                    {worldState.planetName}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-[#594d40] font-mono-tabular">
                    <span>
                      人口 <strong className="font-semibold text-[#2b221b]">{worldState.population}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      幸福度 <strong className="font-semibold text-[#2e5926]">{worldState.happiness}%</strong>
                    </span>
                  </div>
                </div>
              </section>

              {/* Primary Actions */}
              <section className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGrow}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#23451e] bg-[#d4ebc8] hover:bg-[#c5e3b5] border border-[#a3cf8e] rounded-xl transition-colors cursor-pointer"
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>繁荣生长</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleTour}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border bg-[#382f27] text-[#fcf8f0] border-[#261f19] hover:bg-[#4d4136] transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>30秒导览</span>
                </button>
              </section>

              {/* Camera View */}
              <section className="flex flex-col gap-1.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                  相机视角
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'orb', label: '水晶球全景' },
                      { id: 'surface', label: '地表微距' },
                      { id: 'orbit', label: '行星轨道' },
                      { id: 'village', label: '村落特写' },
                    ] as { id: CameraViewId; label: string }[]
                  ).map((v) => {
                    const active =
                      worldState.activeView === v.id && !worldState.tourActive;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectView(v.id)}
                        className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#e3eedc] text-[#23451e] border-[#a6cfa0] shadow-xs'
                            : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Lighting & Sky */}
              <section className="flex flex-col gap-1.5 pb-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                  昼夜光影
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      {
                        id: 'auto',
                        label: '日夜流转',
                        icon: <Compass className="w-3.5 h-3.5" />,
                      },
                      {
                        id: 'day',
                        label: '晴空白昼',
                        icon: <Sun className="w-3.5 h-3.5" />,
                      },
                      {
                        id: 'twilight',
                        label: '暮色黄昏',
                        icon: <Sunset className="w-3.5 h-3.5" />,
                      },
                      {
                        id: 'night',
                        label: '静谧深夜',
                        icon: <Moon className="w-3.5 h-3.5" />,
                      },
                    ] as { id: TimeMode; label: string; icon: React.ReactNode }[]
                  ).map((m) => {
                    const active = worldState.timeMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectTimeMode(m.id)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#e1ecf7] text-[#264669] border-[#a4c2e3] shadow-xs'
                            : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                        }`}
                      >
                        {m.icon}
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* GitHub Button Mobile */}
              <button
                type="button"
                onClick={() => {
                  setFiltersOpen(false);
                  setGithubModalOpen(true);
                }}
                className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-[#24292f] text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Github className="w-4 h-4" />
                <span>推送到 GitHub / 源码下载</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Push & Export Modal */}
      <GitHubModal
        isOpen={githubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        planetName={worldState.planetName}
      />
    </div>
  );
}
