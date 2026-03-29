import { memo, type ReactNode } from "react";

interface FileInfoFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "select";
  options?: { value: string; label: string }[];
  icon?: ReactNode;
}

export const FileInfoField = memo(function FileInfoField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  options,
}: FileInfoFieldProps) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-b-0">
      <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider w-36 shrink-0">
        {label}
      </span>
      {type === "select" && options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-card/50 border border-border/50 rounded px-2 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-card text-foreground">
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-b border-transparent hover:border-border/50 focus:border-primary/50 px-0 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none transition-colors"
        />
      )}
    </div>
  );
});
