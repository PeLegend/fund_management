import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col relative min-h-[calc(100vh-80px)] overflow-hidden view-animate">
      {/* Dramatic Full Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://picsum.photos/seed/monolith/1920/1080"
          alt="Abstract Architecture"
          className="w-full h-full object-cover grayscale opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(73,79,223,0.08)_0%,transparent_60%)]" />
      </div>

      {/* Hero Content Section */}
      <header className="relative z-10 flex-grow flex flex-col items-center justify-center px-6 lg:px-16 text-center py-20 min-h-[calc(100vh-200px)]">
        <div className="max-w-4xl mx-auto space-y-8">
          <span className="text-primary font-bold tracking-[0.2em] uppercase text-xs sm:text-sm block">
            The Future of Wealth
          </span>
          <h1 className="display-hero text-3xl sm:text-5xl md:text-7xl lg:text-9xl mb-8 text-white drop-shadow-2xl font-medium tracking-tighter leading-none">
            Fund<br />Manager
          </h1>
          <p className="text-white/60 text-lg sm:text-2xl max-w-2xl mx-auto leading-relaxed font-light">
            ระบบจัดการกองทุนระดับสถาบัน กระจายความเสี่ยงด้วยอัลกอริทึมอัจฉริยะ แม่นยำทุกเสี้ยววินาที
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center w-full sm:w-auto pt-6">
            <button
              onClick={() => navigate('/policies')}
              className="bg-white text-black hover:bg-zinc-200 font-semibold rounded-full px-10 py-5 text-lg transition-transform active:scale-[0.98] duration-150 flex items-center justify-center gap-3 cursor-pointer shadow-lg"
            >
              Discover Policies
            </button>
            <button
              onClick={() => navigate('/portfolios')}
              className="bg-transparent border border-white/20 text-white hover:bg-white/5 hover:border-white/40 font-semibold rounded-full px-10 py-5 text-lg transition-all active:scale-[0.98] duration-150 flex items-center justify-center gap-3 cursor-pointer"
            >
              Access Portfolio
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
