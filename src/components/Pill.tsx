import type { ComponentProps } from "react";

type Props = ComponentProps<"a"> & { variant?: "dark" | "cobalt" | "light" };

const variants = {
  dark: "bg-ink text-cloud hover:bg-cobalt",
  cobalt: "bg-cobalt text-cloud hover:bg-ink",
  light: "bg-cloud text-ink hover:bg-sky",
};

export function Pill({ variant = "dark", className = "", ...props }: Props) {
  return (
    <a
      {...props}
      className={`inline-flex min-h-11 items-center rounded-full px-5 text-xs font-medium uppercase tracking-wide transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt ${variants[variant]} ${className}`}
    />
  );
}
