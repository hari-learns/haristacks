import PixelLoader from "@/components/PixelLoader";

/** Shown while a route's payload is on its way. */
export default function Loading() {
  return (
    <main id="main" className="wrap flex flex-1 items-center justify-center py-40">
      <p className="t-pixel flex items-center text-faint">
        <PixelLoader size={17} label="Loading" />
        <span className="ml-1">a moment</span>
      </p>
    </main>
  );
}
