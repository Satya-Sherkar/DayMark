import React from "react";
import { Project } from "../../types/project";

interface ProjectBadgeProps {
  project?: Project | null;
  className?: string;
  onClick?: () => void;
}

export const ProjectBadge: React.FC<ProjectBadgeProps> = ({
  project,
  className = "",
  onClick,
}) => {
  if (!project) return null;

  return (
    <span
      onClick={onClick}
      style={{
        borderColor: `${project.color}45`,
        backgroundColor: `${project.color}14`,
        color: project.color,
      }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-medium border font-sans ${
        onClick ? "cursor-pointer hover:opacity-85 transition-opacity" : ""
      } ${className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: project.color }}
      />
      <span className="truncate max-w-[120px]">{project.name}</span>
    </span>
  );
};
