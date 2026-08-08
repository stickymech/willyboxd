interface InlineErrorProps {
  message?: string;
  onRetry: () => void;
}

export function InlineError({ message, onRetry }: InlineErrorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-text-muted">{message ?? "Something went wrong."}</p>
      <button type="button" onClick={onRetry} className="btn btn-primary">
        Try again
      </button>
    </div>
  );
}
