import Image from "next/image";
import { cn } from "@/lib/utils";

interface NorthCoachSymbolProps {
  size?: number;
  className?: string;
  alt?: string;
  variant?: "symbol" | "avatar" | "avatar-rounded";
  priority?: boolean;
}

/**
 * Planorth Koç özel pusula ve vizör monogram sembolü.
 * - `symbol`: Şeffaf arka planlı salt sembol.
 * - `avatar`: Mesaj balonları ve butonlar için daire mavi gradyan rozet içinde sembol.
 * - `avatar-rounded`: Başlıklar için yuvarlatılmış (squircle) mavi gradyan rozet içinde sembol.
 */
export function NorthCoachSymbol({
  size = 32,
  className,
  alt = "Planorth Koç",
  variant = "symbol",
  priority = false,
}: NorthCoachSymbolProps) {
  if (variant === "avatar") {
    return (
      <span
        style={{ width: size, height: size }}
        className={cn(
          "relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-md border border-blue-400/30 overflow-hidden",
          className
        )}
      >
        <Image
          src="/planorth-coach-symbol.png?v=4"
          alt={alt}
          width={size}
          height={size}
          priority={priority}
          className="size-[78%] object-contain drop-shadow-xs select-none pointer-events-none"
        />
      </span>
    );
  }

  if (variant === "avatar-rounded") {
    return (
      <span
        style={{ width: size, height: size }}
        className={cn(
          "relative grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-md border border-blue-400/30 overflow-hidden",
          className
        )}
      >
        <Image
          src="/planorth-coach-symbol.png?v=4"
          alt={alt}
          width={size}
          height={size}
          priority={priority}
          className="size-[78%] object-contain drop-shadow-xs select-none pointer-events-none"
        />
      </span>
    );
  }

  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center select-none", className)} style={{ width: size, height: size }}>
      <Image
        src="/planorth-mark-dark.png?v=4"
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        className="north-logo-light dark:hidden object-contain"
      />
      <Image
        src="/planorth-mark-white.png?v=4"
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        className="north-logo-dark hidden dark:block object-contain"
      />
    </span>
  );
}

export const PlanorthCoachSymbol = NorthCoachSymbol;


