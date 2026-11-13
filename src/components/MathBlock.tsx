import katex from "katex";
import { useMemo } from "react";

interface MathBlockProps {
  tex: string;
  displayMode?: boolean;
  className?: string;
}

export function MathBlock({
  tex,
  displayMode = false,
  className = "",
}: MathBlockProps) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode,
        throwOnError: false,
        strict: false,
      }),
    [tex, displayMode],
  );

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

