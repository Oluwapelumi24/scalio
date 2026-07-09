export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] select-none">
      <div className="relative rounded-[2.5rem] border-[8px] border-slate-900 bg-slate-900 shadow-2xl shadow-indigo-950/30">
        <div className="absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
        <div className="relative h-[560px] overflow-hidden rounded-[2rem] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app-home-screen.png"
            alt="Scalio app home screen"
            className="h-full w-full object-cover object-top"
          />
        </div>
      </div>
    </div>
  )
}
