import Image from "next/image";
import { cn } from "@/lib/utils";

interface NorthLogoProps {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}

export function NorthLogo({
  size = 36,
  width,
  height,
  className,
  priority = false,
  alt = "Planorth",
}: NorthLogoProps) {
  const w = width ?? size;
  const h = height ?? size;

  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center select-none", className)}>
      {/* Açık temada: koyu logo */}
      <Image
        src="/planorth-mark-dark.png?v=4"
        alt={alt}
        width={w}
        height={h}
        priority={priority}
        className="north-logo-light dark:hidden object-contain"
      />
      {/* Koyu temada: beyaz logo */}
      <Image
        src="/planorth-mark-white.png?v=4"
        alt={alt}
        width={w}
        height={h}
        priority={priority}
        className="north-logo-dark hidden dark:block object-contain"
      />
    </span>
  );
}

export const PlanorthLogo = NorthLogo;


