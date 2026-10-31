import { SmoothScroll } from "@/components/SmoothScroll";

// Web pública: scroll con inercia. El panel de contenidos (/studio) queda fuera de este grupo.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      {children}
    </>
  );
}
