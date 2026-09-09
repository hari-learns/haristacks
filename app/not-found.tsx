import Link from "next/link";
import PixelHorizon from "@/components/PixelHorizon";
import SiteHeader from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative flex flex-1 flex-col justify-center overflow-hidden">
        <PixelHorizon className="absolute inset-0" horizon={0.5} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, color-mix(in oklab, var(--ground) 70%, transparent) 40%, var(--ground) 82%)",
          }}
          aria-hidden="true"
        />
        <div className="wrap relative z-10 py-40">
          <p className="t-pixel text-faint">404</p>
          <h1 className="t-title mt-4 max-w-[16ch]">This one drifted off.</h1>
          <Link href="/" className="pill mt-9">
            Back home
          </Link>
        </div>
      </main>
    </>
  );
}
