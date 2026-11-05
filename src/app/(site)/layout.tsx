import { SmoothScroll } from "@/components/SmoothScroll";

// Web pública: scroll con inercia.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      {children}
    </>
  );
}
