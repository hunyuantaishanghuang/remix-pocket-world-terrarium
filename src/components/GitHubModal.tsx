import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Github,
  Loader2,
  Terminal,
  Upload,
  X,
} from 'lucide-react';
import JSZip from 'jszip';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  planetName: string;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  planetName,
}) => {
  const [activeTab, setActiveTab] = useState<'api' | 'zip' | 'cli'>('api');
  const [token, setToken] = useState('');
  const [repoName, setRepoName] = useState('pocket-world-terrarium');
  const [isPrivate, setIsPrivate] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [copiedCli, setCopiedCli] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Gather files for ZIP / GitHub push
  const getProjectFiles = async (): Promise<Record<string, string>> => {
    // We can fetch our source files directly via Vite dev server
    const filePaths = [
      '/index.html',
      '/package.json',
      '/tsconfig.json',
      '/vite.config.ts',
      '/metadata.json',
      '/.gitignore',
      '/.env.example',
      '/src/main.tsx',
      '/src/App.tsx',
      '/src/index.css',
      '/src/types/world.ts',
      '/src/utils/audio.ts',
      '/src/utils/textures.ts',
      '/src/three/PocketWorldScene.ts',
      '/src/three/MiniatureObjects.ts',
      '/src/three/PlanetTerrain.ts',
      '/src/three/RoomEnvironment.ts',
    ];

    const files: Record<string, string> = {};

    for (const path of filePaths) {
      try {
        const res = await fetch(path);
        if (res.ok) {
          const text = await res.text();
          // Remove leading slash for archive path
          const cleanPath = path.startsWith('/') ? path.slice(1) : path;
          files[cleanPath] = text;
        }
      } catch (err) {
        console.warn('Could not fetch file for export:', path, err);
      }
    }

    files['README.md'] = `# Pocket World // 微缩水晶球生态星球 (Terrarium Planet)

一个使用 Three.js 打造的唯美治愈系微缩 3D 生态星球建造器。星球悬浮在手工胡桃木底座的玻璃水晶球穹顶之中，包含丰富的低多边形建筑、动态动物生灵、全套昼夜气象模拟与温馨互动体验。

## 🌟 特色元素与功能

- **丰富微缩建筑与地标**：
  - 田园小屋（窗户在黄昏夜晚泛出暖光）
  - 转动风车（白色帆布叶片悠闲旋转）
  - 海岸灯塔（红白条纹，夜间旋转光束破晓）
  - 祈福鸟居（典雅朱红传统鸟居与石灯笼）
  - 露天温泉（天然叠石池畔，升腾氤氲热气与竹筒水流）
  - 观景凉亭（传统飞檐歇山顶六角木亭与悬挂暖灯）
  - 瞭望石塔、石圈篝火、路灯小径、彩绘蜂箱
- **灵动自然与动物生灵**：
  - 森林梅花鹿（轻巧踏步、低头吃草、鹿角摇曳）
  - 温顺白绵羊（在木栅栏牧场内欢快觅食）
  - 快乐村民（在水井、篝火与小屋门廊间散步交谈）
  - 沿海帆船与游弋天鹅野鸭（在水面荡开同心涟漪波纹）
  - 飘落花瓣的浪漫粉色樱花树、高山冷杉松树、热带海滩椰子树
  - 梦幻晶莹的水晶矿脉（夜幕下散发呼吸般的紫青微光）
- **天象与动态气象粒子魔法**：
  - 润泽雨云（降下甘霖浇灌地表植被，激发生长）
  - 冬雪霜云（飘扬洁白飞雪，为屋顶和山峰披上薄霜）
  - 梦幻彩虹（通透七彩拱桥横跨玻璃球穹顶）
  - 许愿流星（金色尾迹划破夜空，村民抬头欢呼）
  - 选中气象工具时，玻璃球内实时激活动态天气粒子（雨丝、雪花、樱花瓣、林木落叶、星尘）！
- **声音与全景导览**：
  - 基于 Web Audio API 的零依赖自然五音治愈音效
  - 30 秒全景电影级镜头编排导览
  - 多重视角（水晶球全貌、地表微距、轨道全景、村落特写）
  - 自由日夜光影流转（自动轮转、晴空白昼、暮色黄昏、静谧深夜）

## 🚀 启动运行

\`\`\`bash
# 安装依赖
npm install

# 启动本地开发服务 (端口 3000)
npm run dev

# 编译打包
npm run build
\`\`\`
`;

    return files;
  };

  // 2. Download ZIP
  const handleDownloadZip = async () => {
    setLoading(true);
    setStatus('正在打包项目源码...');
    setErrorMsg(null);
    try {
      const files = await getProjectFiles();
      const zip = new JSZip();

      for (const [path, content] of Object.entries(files)) {
        zip.file(path, content);
      }

      setStatus('正在生成压缩文件...');
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pocket-world-${planetName.toLowerCase().replace(/\s+/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('✅ 源码压缩包已下载！');
    } catch (err: any) {
      setErrorMsg('生成压缩包失败：' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  // 3. Push directly to GitHub via API
  const handlePushToGithub = async () => {
    if (!token.trim()) {
      setErrorMsg('请输入 GitHub Personal Access Token');
      return;
    }
    const cleanRepo = repoName.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
    if (!cleanRepo) {
      setErrorMsg('请输入仓库名称');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessUrl(null);

    try {
      // 1. Verify token & get user
      setStatus('正在验证 GitHub Token...');
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!userRes.ok) {
        throw new Error('GitHub Token 验证失败，请确认拥有 repo 权限');
      }

      const userData = await userRes.json();
      const owner = cleanRepo.includes('/') ? cleanRepo.split('/')[0] : userData.login;
      const targetRepo = cleanRepo.includes('/') ? cleanRepo.split('/')[1] : cleanRepo;

      // 2. Check if repo exists, create if not
      setStatus(`正在检查仓库 ${owner}/${targetRepo}...`);
      let repoRes = await fetch(`https://api.github.com/repos/${owner}/${targetRepo}`, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (repoRes.status === 404) {
        setStatus(`仓库不存在，正在自动创建 ${targetRepo}...`);
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: targetRepo,
            description: 'Pocket World // Terrarium Planet - A cozy 3D miniature world builder built in Three.js',
            private: isPrivate,
            auto_init: true,
          }),
        });

        if (!createRes.ok) {
          const errData = await createRes.json().catch(() => ({}));
          throw new Error('创建仓库失败：' + (errData.message || createRes.statusText));
        }

        // Wait a second for repo initialization
        await new Promise((r) => setTimeout(r, 1200));
        repoRes = await fetch(`https://api.github.com/repos/${owner}/${targetRepo}`, {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
      }

      // 3. Fetch project files
      setStatus('正在收集项目源代码文件...');
      const files = await getProjectFiles();

      // 4. Create blobs and tree
      setStatus('正在上传文件数据块 (Git Blobs)...');
      const treeItems: { path: string; mode: string; type: string; sha: string }[] = [];

      for (const [path, content] of Object.entries(files)) {
        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${targetRepo}/git/blobs`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            encoding: 'utf-8',
          }),
        });

        if (blobRes.ok) {
          const blobData = await blobRes.json();
          treeItems.push({
            path,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha,
          });
        }
      }

      // 5. Get current latest commit on main (or master)
      setStatus('获取主分支指针...');
      let baseTreeSha: string | undefined;
      let parentCommitSha: string | undefined;

      const refRes = await fetch(`https://api.github.com/repos/${owner}/${targetRepo}/git/ref/heads/main`, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (refRes.ok) {
        const refData = await refRes.json();
        parentCommitSha = refData.object.sha;
        const commitRes = await fetch(`https://api.github.com/repos/${owner}/${targetRepo}/git/commits/${parentCommitSha}`, {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (commitRes.ok) {
          const commitData = await commitRes.json();
          baseTreeSha = commitData.tree.sha;
        }
      }

      // 6. Create Git Tree
      setStatus('正在构建 Git 目录树 (Tree)...');
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${targetRepo}/git/trees`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tree: treeItems,
          base_tree: baseTreeSha,
        }),
      });

      if (!treeRes.ok) {
        throw new Error('构建 Git 目录树失败');
      }
      const newTreeData = await treeRes.json();

      // 7. Create Commit
      setStatus('正在创建提交 (Commit)...');
      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${targetRepo}/git/commits`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `feat: Pocket World Terrarium - ${planetName} (Chinese localization & new elements)`,
          tree: newTreeData.sha,
          parents: parentCommitSha ? [parentCommitSha] : [],
        }),
      });

      if (!commitRes.ok) {
        throw new Error('创建 Git 提交失败');
      }
      const newCommit = await commitRes.json();

      // 8. Update ref
      setStatus('正在更新 main 分支...');
      let updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${targetRepo}/git/refs/heads/main`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sha: newCommit.sha,
          force: true,
        }),
      });

      if (!updateRefRes.ok) {
        // Create ref if didn't exist
        updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${targetRepo}/git/refs`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: 'refs/heads/main',
            sha: newCommit.sha,
          }),
        });
      }

      const finalUrl = `https://github.com/${owner}/${targetRepo}`;
      setSuccessUrl(finalUrl);
      setStatus('🎉 成功推送到 GitHub！');
    } catch (err: any) {
      setErrorMsg(err.message || '推送到 GitHub 发生错误，请检查 Token 权限');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const cliCommands = `git remote add origin https://github.com/d2727314616/${repoName.trim() || 'pocket-world-terrarium'}.git
git branch -M main
git push -u origin main`;

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommands);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="GitHub 导出与推送助手"
        className="relative z-10 w-full max-w-lg bg-[#faf5ec] text-[#382f27] rounded-2xl border border-[#e2d7c5] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#e6dccb] bg-[#f5ede0]/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#24292f] text-white flex items-center justify-center shadow-xs">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#2b221b]">推送到 GitHub & 源码导出</h2>
              <p className="text-[11px] text-[#786b5a]">将微缩生态星球项目完整保存到您的 GitHub</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#594d40] hover:bg-[#eae1d3] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#e6dccb] bg-[#f8f2e7] px-4 pt-2 gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'api'
                ? 'border-[#2b221b] text-[#2b221b] font-semibold'
                : 'border-transparent text-[#786b5a] hover:text-[#2b221b]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              一键直推 GitHub
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('zip')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'zip'
                ? 'border-[#2b221b] text-[#2b221b] font-semibold'
                : 'border-transparent text-[#786b5a] hover:text-[#2b221b]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              打包下载 ZIP
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cli')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'cli'
                ? 'border-[#2b221b] text-[#2b221b] font-semibold'
                : 'border-transparent text-[#786b5a] hover:text-[#2b221b]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              Git 命令行
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {successUrl && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1">
                <p className="font-semibold">已成功推送到您的 GitHub！</p>
                <a
                  href={successUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-emerald-700 underline font-medium hover:text-emerald-900"
                >
                  访问 GitHub 仓库
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 1: API Direct Push */}
          {activeTab === 'api' && (
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#2b221b]">
                  仓库名称 (Repository Name)
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="例如: pocket-world-terrarium"
                  className="px-3 py-2 text-xs bg-[#fffdf9] border border-[#d6c8b4] rounded-xl text-[#2b221b] focus:outline-none focus:ring-2 focus:ring-[#8fae72]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#2b221b]">
                    GitHub Personal Access Token (PAT)
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Pocket+World+Terrarium"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#4d7237] hover:underline flex items-center gap-1"
                  >
                    生成 Token
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="px-3 py-2 text-xs font-mono bg-[#fffdf9] border border-[#d6c8b4] rounded-xl text-[#2b221b] focus:outline-none focus:ring-2 focus:ring-[#8fae72]"
                />
                <span className="text-[10px] text-[#8c7d6b]">
                  提示：Token 仅在浏览器本地运行，用于调用 GitHub API 创建仓库与提交代码，安全无残留。
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded text-[#4d7237] focus:ring-[#8fae72] cursor-pointer"
                />
                <label htmlFor="isPrivate" className="text-xs text-[#594d40] cursor-pointer">
                  设为私有仓库 (Private Repository)
                </label>
              </div>

              {status && (
                <div className="p-2.5 bg-[#f3ece0] rounded-xl text-xs text-[#594d40] flex items-center gap-2">
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4d7237]" />}
                  <span>{status}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handlePushToGithub}
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-[#2b221b] hover:bg-[#43362b] text-[#fcf8f0] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在推送到 GitHub...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>立即推送到 GitHub</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: Download ZIP */}
          {activeTab === 'zip' && (
            <div className="flex flex-col gap-3.5 py-1">
              <p className="text-xs text-[#594d40] leading-relaxed">
                一键将完整的微缩世界项目源代码（包含所有 3D 模型代码、材质纹理、Web Audio 治愈音效、生态系统与 TypeScript 配置）打包为 ZIP 压缩包下载到您的本地电脑。
              </p>

              <div className="p-3 bg-[#f5ede0] rounded-xl border border-[#e2d7c5] flex flex-col gap-1 text-xs text-[#6e5d4a]">
                <div className="font-semibold text-[#2b221b]">包含完整项目文件：</div>
                <div className="font-mono text-[11px] grid grid-cols-2 gap-1 mt-1">
                  <span>• /src/three/</span>
                  <span>• /src/types/</span>
                  <span>• /src/utils/</span>
                  <span>• /src/App.tsx</span>
                  <span>• package.json</span>
                  <span>• vite.config.ts</span>
                </div>
              </div>

              {status && (
                <div className="p-2.5 bg-[#f3ece0] rounded-xl text-xs text-[#594d40] flex items-center gap-2">
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4d7237]" />}
                  <span>{status}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-[#4d7237] hover:bg-[#3d5e2a] text-[#fcf8f0] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在打包...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>下载项目源码压缩包 (.zip)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: CLI Commands */}
          {activeTab === 'cli' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[#594d40]">
                如果您在本地终端操作，复制以下标准 Git 命令即可直接将本地仓库推送到 GitHub：
              </p>

              <div className="relative">
                <pre className="p-3 bg-[#24292f] text-[#f0f6fc] text-xs font-mono rounded-xl overflow-x-auto leading-relaxed">
                  {cliCommands}
                </pre>
                <button
                  type="button"
                  onClick={handleCopyCli}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedCli ? '已复制！' : '复制命令'}</span>
                </button>
              </div>

              <div className="text-[11px] text-[#7a6b5a] leading-relaxed">
                💡 说明：您也可以克隆仓库并在本地直接运行 <code className="font-mono bg-[#eee5d5] px-1 py-0.5 rounded text-[#2b221b]">npm install && npm run dev</code> 开启本地微缩世界体验。
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
