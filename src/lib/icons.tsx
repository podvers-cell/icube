import { Mic, Video, Clapperboard, MonitorPlay, Share2, Sparkles, Target, Zap } from "lucide-react";

import type { ComponentType } from "react";

const iconMap: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  Mic,
  Video,
  Clapperboard,
  MonitorPlay,
  Share2,
  Sparkles,
  Target,
  Zap,
};

export function getIcon(name: string) {
  return iconMap[name] || Mic;
}
