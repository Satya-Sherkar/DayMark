import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { CreateProjectInput, Project, UpdateProjectInput } from "../../types/project";
import { PRESET_COLORS } from "../../constants/colors";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProjectInput | UpdateProjectInput) => Promise<void>;
  initialProject?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialProject,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#C64D38");
  const [archived, setArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description || "");
      setColor(initialProject.color || "#C64D38");
      setArchived(initialProject.archived);
    } else {
      setName("");
      setDescription("");
      setColor("#C64D38");
      setArchived(false);
    }
    setError(null);
  }, [initialProject, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (initialProject) {
        await onSubmit({
          name: name.trim(),
          description: description.trim() ? description.trim() : null,
          color,
          archived,
        });
      } else {
        await onSubmit({
          name: name.trim(),
          description: description.trim() ? description.trim() : null,
          color,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
      <div className="bg-dm-surface border border-dm-border rounded-[8px] w-full max-w-md shadow-xl overflow-hidden animate-in fade-in duration-150">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dm-border">
          <h2 className="font-heading text-sm font-bold text-dm-text-primary tracking-tight">
            {initialProject ? "Edit Project" : "New Project"}
          </h2>
          <button
            onClick={onClose}
            className="text-dm-text-secondary hover:text-dm-text-primary p-1 rounded-[4px] hover:bg-dm-bg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-dm-accent/10 border border-dm-accent/30 rounded-[4px] text-xs font-sans text-dm-accent">
              {error}
            </div>
          )}

          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Core Engine, Editorial Redesign"
              className="w-full px-3 py-2 rounded-[6px] border border-dm-border bg-dm-bg text-dm-text-primary placeholder:text-dm-text-secondary text-xs sm:text-sm font-sans focus:outline-none focus:border-dm-accent focus:ring-1 focus:ring-dm-accent transition-colors"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope or objectives..."
              className="w-full px-3 py-2 rounded-[6px] border border-dm-border bg-dm-bg text-dm-text-primary placeholder:text-dm-text-secondary text-xs sm:text-sm font-sans focus:outline-none focus:border-dm-accent focus:ring-1 focus:ring-dm-accent transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-dm-text-secondary mb-2">
              Color Palette
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((c) => {
                const isSelected = color.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    title={c.label}
                    className="h-7 rounded-[4px] flex items-center justify-center transition-transform hover:scale-105 cursor-pointer relative border border-black/10 dark:border-white/10"
                    style={{ backgroundColor: c.value }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {initialProject && (
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-sans text-dm-text-secondary">
                <input
                  type="checkbox"
                  checked={archived}
                  onChange={(e) => setArchived(e.target.checked)}
                  className="rounded-[3px] border-dm-border text-dm-accent focus:ring-dm-accent"
                />
                <span>Archive this project</span>
              </label>
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-dm-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-sans font-medium text-dm-text-secondary hover:text-dm-text-primary hover:bg-dm-bg rounded-[6px] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-sans font-medium text-white bg-dm-accent hover:bg-dm-accent-hover disabled:opacity-50 rounded-[6px] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-dm-accent/30"
            >
              {isSubmitting ? "Saving..." : initialProject ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
