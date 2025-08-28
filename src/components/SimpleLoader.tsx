import ConcentricLoader from "./mvpblocks/concentric-loader";

export default function SimpleLoader({ message = null, fullScreen = true }: { message?: string | null, fullScreen?: boolean }) {
  return <div className={`grid content-center ${fullScreen ? 'h-screen' : ''}`}>
    <ConcentricLoader />
    {message && <p className="text-center text-[0.75em] mt-4">{message}</p>}
  </div>;
}