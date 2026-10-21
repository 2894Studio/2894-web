import Image from "next/image";

type Tone = "cobalt" | "ink" | "sky" | "paper";

const screens: Record<Tone, string> = {
  cobalt: "bg-[linear-gradient(135deg,var(--deep-cobalt),var(--sky-blue))] text-paper",
  ink: "bg-ink text-paper",
  sky: "bg-[linear-gradient(160deg,var(--sky-blue),#dfeeff)] text-ink",
  paper: "bg-paper text-ink",
};

type Props = { scene: string; alt: string; title: string; tone?: Tone; priority?: boolean };

// Escena fotográfica + portátil con la pantalla del proyecto (CSS): placeholder de "producto en contexto".
export function ImageFrame({ scene, alt, title, tone = "ink", priority }: Props) {
  return (
    <div className="group relative aspect-[4/3] overflow-hidden bg-gray-soft">
      <Image
        src={scene}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width:768px) 50vw, 100vw"
        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-ink/10" />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 w-[62%] -translate-x-1/2 -translate-y-1/2 [perspective:1400px]"
      >
        <div className="origin-center transition-transform duration-[900ms] ease-out [transform:rotateX(8deg)_rotateY(-14deg)_rotateZ(2deg)] group-hover:[transform:rotateX(2deg)_rotateY(-4deg)_rotateZ(0deg)]">
          <div className="rounded-t-[10px] bg-ink p-[1.6%] shadow-[0_30px_60px_rgb(0_0_0/0.35)]">
            <div className={`flex aspect-[16/10] flex-col justify-between overflow-hidden p-[6%] ${screens[tone]}`}>
              <span className="text-[clamp(0.5rem,1vw,0.75rem)] font-medium uppercase tracking-wide opacity-80">2894_</span>
              <span className="max-w-[80%] text-[clamp(0.9rem,2.4vw,1.9rem)] font-light uppercase leading-[0.95] tracking-tight">
                {title}
              </span>
            </div>
          </div>
          <div className="h-[2.5%] min-h-1.5 rounded-b-[14px] bg-[#c9c9cd]" />
        </div>
      </div>
    </div>
  );
}
