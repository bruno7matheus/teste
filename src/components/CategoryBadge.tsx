
"use client";

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CATEGORY_ICON_MAP } from '@/lib/constants';

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className }) => {
  const iconName = CATEGORY_ICON_MAP[category] || CATEGORY_ICON_MAP.default;
  // @ts-ignore
  const IconComponent = LucideIcons[iconName] || LucideIcons.Briefcase;

  // Simple hash function to get a color class based on category name
  const getColorClass = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "bg-pink-500/20 text-pink-700 border-pink-500/30",
      "bg-blue-500/20 text-blue-700 border-blue-500/30",
      "bg-green-500/20 text-green-700 border-green-500/30",
      "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
      "bg-purple-500/20 text-purple-700 border-purple-500/30",
      "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
      "bg-teal-500/20 text-teal-700 border-teal-500/30",
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Badge variant="outline" className={cn("flex items-center gap-1.5 capitalize", getColorClass(category), className)}>
      <IconComponent className="w-3 h-3" />
      {category}
    </Badge>
  );
};

export default React.memo(CategoryBadge);
