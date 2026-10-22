export type ToolId =
  // 原创与经典元素
  | 'tree'
  | 'sakura'
  | 'house'
  | 'pavilion'
  | 'windmill'
  | 'lighthouse'
  | 'watchtower'
  | 'torii'
  | 'campfire'
  | 'onsen'
  | 'lantern'
  | 'crystal'
  | 'balloon'
  // 水域与沿海
  | 'sailboat'
  | 'dock'
  | 'duck'
  // 自然与生灵
  | 'flower'
  | 'beehive'
  | 'villager'
  | 'sheep'
  | 'deer'
  // 天气与气象
  | 'cloud'
  | 'snowcloud'
  | 'rainbow'
  | 'shootingstar'
  // 地貌与塑形
  | 'mountain'
  | 'lake'
  | 'raise'
  | 'lower'
  | 'remove';

export type ToolCategory = 'all' | 'village' | 'water' | 'nature' | 'weather' | 'sculpt';

export type CameraViewId = 'orb' | 'surface' | 'orbit' | 'village';

export type TimeMode = 'auto' | 'day' | 'twilight' | 'night';

export interface WorldState {
  planetName: string;
  population: number;
  happiness: number;
  dayCount: number;
  activeTool: ToolId;
  activeView: CameraViewId;
  timeMode: TimeMode;
  /** 0..1: 0.25=温暖午后, 0.52=暮色黄昏, 0.78=静谧深夜 */
  timeOfDay: number;
  tourActive: boolean;
  tourElapsed: number;
  tourPhase: string;
  soundEnabled?: boolean;
  objectCounts: {
    houses: number;
    trees: number;
    sakura: number;
    windmills: number;
    lighthouses: number;
    villagers: number;
    sheep: number;
    deer: number;
    clouds: number;
    flowers: number;
    boats: number;
    torii: number;
    onsen: number;
    crystals: number;
    pavilions: number;
  };
}

export interface ToolDefinition {
  id: ToolId;
  label: string;
  category: Exclude<ToolCategory, 'all'>;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  description: string;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // 村落与标志建筑
  {
    id: 'house',
    label: '田园小屋',
    category: 'village',
    accentBg: 'bg-[#fce4d6]',
    accentBorder: 'border-[#ebb69b]',
    accentText: 'text-[#6e3820]',
    description: '建造马卡龙色调的田园小屋，夜晚窗户透出温馨暖黄灯光',
  },
  {
    id: 'pavilion',
    label: '观景凉亭',
    category: 'village',
    accentBg: 'bg-[#fed7aa]',
    accentBorder: 'border-[#fba06b]',
    accentText: 'text-[#7c2d12]',
    description: '建造传统飞檐木构六角凉亭，带有歇山顶与中央夜光灯笼',
  },
  {
    id: 'windmill',
    label: '转动风车',
    category: 'village',
    accentBg: 'bg-[#fdf2d0]',
    accentBorder: 'border-[#e5cc87]',
    accentText: 'text-[#665014]',
    description: '竖立带有徐徐转动白色帆布叶片的乡村风车磨坊',
  },
  {
    id: 'torii',
    label: '祈福鸟居',
    category: 'village',
    accentBg: 'bg-[#ffe4e6]',
    accentBorder: 'border-[#fda4af]',
    accentText: 'text-[#9f1239]',
    description: '立起典雅朱红色传统鸟居与石灯笼，守护微缩生态的祥和',
  },
  {
    id: 'lighthouse',
    label: '海岸灯塔',
    category: 'village',
    accentBg: 'bg-[#fadadd]',
    accentBorder: 'border-[#e59fa6]',
    accentText: 'text-[#70232b]',
    description: '在海角悬崖建造红白相间的条纹灯塔，光束在夜海扫过',
  },
  {
    id: 'watchtower',
    label: '瞭望石塔',
    category: 'village',
    accentBg: 'bg-[#e6e2f5]',
    accentBorder: 'border-[#b8b0d9]',
    accentText: 'text-[#3c345c]',
    description: '筑起带有飞扬缎带旗帜的童话古石瞭望要塞',
  },
  {
    id: 'campfire',
    label: '欢聚篝火',
    category: 'village',
    accentBg: 'bg-[#fde2c8]',
    accentBorder: 'border-[#eba972]',
    accentText: 'text-[#70360f]',
    description: '点燃噼啪作响的石圈篝火，村民在暮色降临时会围坐取暖',
  },
  {
    id: 'onsen',
    label: '热气温泉',
    category: 'village',
    accentBg: 'bg-[#cffafe]',
    accentBorder: 'border-[#67e8f9]',
    accentText: 'text-[#0e7490]',
    description: '开凿水汽氤氲的天然石砌温泉池，伴有轻柔冒泡的清波与竹筒流水',
  },
  {
    id: 'lantern',
    label: '路灯石径',
    category: 'village',
    accentBg: 'bg-[#fef0c9]',
    accentBorder: 'border-[#e5c777]',
    accentText: 'text-[#634b10]',
    description: '铺设黄昏发光的复古铁艺路灯与田园鹅卵石小径',
  },
  {
    id: 'balloon',
    label: '梦幻热气球',
    category: 'village',
    accentBg: 'bg-[#f9d9e6]',
    accentBorder: 'border-[#e39db9]',
    accentText: 'text-[#6b2543]',
    description: '放飞带有粉嫩条纹、编织吊篮与微光燃烧器的热气球',
  },

  // 水域与沿海生活
  {
    id: 'sailboat',
    label: '木质帆船',
    category: 'water',
    accentBg: 'bg-[#d6eff7]',
    accentBorder: 'border-[#8ec9de]',
    accentText: 'text-[#1c5166]',
    description: '在蔚蓝水面扬起一艘木制小帆船，桅杆挂有夜行暖灯',
  },
  {
    id: 'dock',
    label: '码头与拱桥',
    category: 'water',
    accentBg: 'bg-[#efe4d4]',
    accentBorder: 'border-[#cbb393]',
    accentText: 'text-[#543d22]',
    description: '在岸边搭建伸向水面的木栈桥，或在水道间架起优雅石拱桥',
  },
  {
    id: 'duck',
    label: '白鹅与水鸭',
    category: 'water',
    accentBg: 'bg-[#e2f5ef]',
    accentBorder: 'border-[#9ad1c0]',
    accentText: 'text-[#1f5747]',
    description: '让惬意游动的水鸭与纯白优雅天鹅在海面荡开涟漪圈',
  },

  // 自然与奇幻生灵
  {
    id: 'tree',
    label: '自然林木',
    category: 'nature',
    accentBg: 'bg-[#dff0d8]',
    accentBorder: 'border-[#a6cfa0]',
    accentText: 'text-[#2c5227]',
    description: '在丘陵种橡树，在雪峰种高山松，在沙滩种热带椰子树',
  },
  {
    id: 'sakura',
    label: '落樱古树',
    category: 'nature',
    accentBg: 'bg-[#fce7f3]',
    accentBorder: 'border-[#f472b6]',
    accentText: 'text-[#9d174d]',
    description: '栽下一树繁花盛放的浪漫樱花树，常伴有粉色花瓣轻盈飘落',
  },
  {
    id: 'flower',
    label: '田野花丛',
    category: 'nature',
    accentBg: 'bg-[#f5dff7]',
    accentBorder: 'border-[#d6a9dc]',
    accentText: 'text-[#5b2a61]',
    description: '在绿意草坪上点缀五彩斑斓的芬芳野花丛',
  },
  {
    id: 'beehive',
    label: '彩绘蜂箱',
    category: 'nature',
    accentBg: 'bg-[#fcf0c2]',
    accentBorder: 'border-[#e3c76b]',
    accentText: 'text-[#5e480d]',
    description: '放置木制彩绘蜂房，引来围绕花香翩翩飞舞的蝴蝶与小蜜蜂',
  },
  {
    id: 'crystal',
    label: '秘境水晶',
    category: 'nature',
    accentBg: 'bg-[#ede9fe]',
    accentBorder: 'border-[#c4b5fd]',
    accentText: 'text-[#5b21b6]',
    description: '点缀神秘发光的棱柱晶石簇，夜幕下泛出幽微梦幻的紫青微光',
  },
  {
    id: 'villager',
    label: '小村民',
    category: 'nature',
    accentBg: 'bg-[#fde8c8]',
    accentBorder: 'border-[#e6be83]',
    accentText: 'text-[#664414]',
    description: '迎来快乐散步的小村民，他们在小屋、篝火、水井间漫游问候',
  },
  {
    id: 'sheep',
    label: '温顺绵羊',
    category: 'nature',
    accentBg: 'bg-[#f2efe9]',
    accentBorder: 'border-[#ccc5b8]',
    accentText: 'text-[#474137]',
    description: '添置一只毛茸茸的白色小绵羊，低头在草地上欢快咀嚼',
  },
  {
    id: 'deer',
    label: '森林灵鹿',
    category: 'nature',
    accentBg: 'bg-[#ffedd5]',
    accentBorder: 'border-[#fdba74]',
    accentText: 'text-[#9a3412]',
    description: '召唤头顶枝状鹿角的优雅梅花小鹿，在林间草地悠闲踏步',
  },

  // 天象与气象魔法
  {
    id: 'cloud',
    label: '润泽雨云',
    category: 'weather',
    accentBg: 'bg-[#e1ecf7]',
    accentBorder: 'border-[#a4c2e3]',
    accentText: 'text-[#264669]',
    description: '召唤蓬松雨云在轨道飘拂，降下甘霖滋养地表树木与花朵',
  },
  {
    id: 'snowcloud',
    label: '冬雪霜云',
    category: 'weather',
    accentBg: 'bg-[#e4f2fc]',
    accentBorder: 'border-[#9ec8e8]',
    accentText: 'text-[#1e4b6e]',
    description: '召唤晶莹落雪云，让漫天飞雪将山峦与屋檐披上一层薄霜',
  },
  {
    id: 'rainbow',
    label: '梦幻彩虹',
    category: 'weather',
    accentBg: 'bg-[#fce3f0]',
    accentBorder: 'border-[#e3a1c4]',
    accentText: 'text-[#662247]',
    description: '在玻璃球穹顶架起一道晶莹剔透的七彩马卡龙弯拱彩虹',
  },
  {
    id: 'shootingstar',
    label: '许愿流星',
    category: 'weather',
    accentBg: 'bg-[#e5dff7]',
    accentBorder: 'border-[#b3a3e3]',
    accentText: 'text-[#392769]',
    description: '让一颗拖曳金色星尘尾迹的璀璨流星划破夜空',
  },

  // 地貌塑形与清除
  {
    id: 'mountain',
    label: '拔起雪山',
    category: 'sculpt',
    accentBg: 'bg-[#e3e6ee]',
    accentBorder: 'border-[#b2bacf]',
    accentText: 'text-[#363e52]',
    description: '隆起一座陡峭嶙峋的低多边形雪顶险峰',
  },
  {
    id: 'lake',
    label: '开凿湖海',
    category: 'sculpt',
    accentBg: 'bg-[#d4f1f4]',
    accentBorder: 'border-[#8fd3db]',
    accentText: 'text-[#1c5961]',
    description: '在地表凹刻出深邃碧蓝的水盆与内陆湖泊',
  },
  {
    id: 'raise',
    label: '抬升陆地',
    category: 'sculpt',
    accentBg: 'bg-[#e6eed6]',
    accentBorder: 'border-[#b5c993]',
    accentText: 'text-[#3b4f1d]',
    description: '推高球面多边形网格，塑造起伏丘陵与高原',
  },
  {
    id: 'lower',
    label: '降低地势',
    category: 'sculpt',
    accentBg: 'bg-[#d8edf2]',
    accentBorder: 'border-[#96c9d6]',
    accentText: 'text-[#20515e]',
    description: '沉降局部地块，引流湛蓝海水注入汇聚',
  },
  {
    id: 'remove',
    label: '清除物品',
    category: 'sculpt',
    accentBg: 'bg-[#f7dede]',
    accentBorder: 'border-[#dfa4a4]',
    accentText: 'text-[#692626]',
    description: '点击星球表面已放置的建筑、生灵或天空元素以清空',
  },
];
