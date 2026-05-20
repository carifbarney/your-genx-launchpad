import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import xcelerateLogo from "@/assets/xcelerate-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Xcelerate — Clarity for Gen X Women in Digital Marketing" },
      { name: "description", content: "AI-powered starting point for Gen X women building digital and affiliate income from home." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 bottom-0 top-1/2"><div className="xcel-grid-floor" /></div>
        <div className="absolute -top-20 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[#FE2DA3] opacity-25 blur-3xl xcel-blob" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-[#8A2BE2] opacity-25 blur-3xl xcel-blob" style={{ animationDelay: "-6s" }} />
      </div>
      <div className="relative max-w-xl text-center">
        <img src={xcelerateLogo} alt="Xcelerate" className="mx-auto h-20 w-auto drop-shadow-[0_0_18px_rgba(254,45,163,0.65)]" />
        <p className="xcel-kicker mt-6 text-[#00F0D1]">All gas — no brakes</p>
        <h1 className="mt-3 text-4xl leading-tight tracking-wide xcel-neon-pink sm:text-5xl" style={{ fontFamily: "Anton, sans-serif", textTransform: "uppercase" }}>
          Done doubting.<br />Time to build.
        </h1>
        <p className="mt-6 text-base normal-case tracking-normal text-[#F5F2EC]/75">
          Salespage rolling out soon — head to{" "}
          <Link to="/login" className="font-bold text-[#FE2DA3] underline underline-offset-4 transition hover:text-[#00F0D1]">/login</Link>{" "}
          to fire up the tool.
        </p>
      </div>
    </main>
  );
}
