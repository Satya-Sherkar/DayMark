import React from "react";
import { Tag } from "lucide-react";
import { Category } from "../../types/category";

interface CategoryBadgeProps {
  category?: Category | null;
  className?: string;
  onClick?: () => void;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  className = "",
  onClick,
}) => {
  if (!category) return null;

  return (
    <span
      onClick={onClick}
      style={{
        borderColor: `${category.color}40`,
        backgroundColor: `${category.color}12`,
        color: category.color,
      }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-medium border font-sans ${
        onClick ? "cursor-pointer hover:opacity-85 transition-opacity" : ""
      } ${className}`}
    >
      <Tag className="w-2.5 h-2.5 opacity-70 shrink-0" />
      <span className="truncate max-w-[100px]">{category.name}</span>
    </span>
  );
};
