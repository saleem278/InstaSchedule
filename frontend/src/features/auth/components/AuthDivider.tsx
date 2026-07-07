interface AuthDividerProps {
  label: string;
}

export function AuthDivider({ label }: AuthDividerProps): React.JSX.Element {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wide text-textTertiary">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
