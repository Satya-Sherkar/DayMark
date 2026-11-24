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
        borderColor: `${project.color}40`,
        backgroundColor: `${project.color}15`,
        color: project.color,
      }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
        onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      } ${className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: project.color }}
      />
      <span className="truncate max-w-[120px]">{project.name}</span>
    </span>
  );
};
