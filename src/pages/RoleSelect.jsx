import { Upload, Presentation, FileBarChart2, ArrowRight } from 'lucide-react'

export default function RoleSelect({ onSelect }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }}>
          <FileBarChart2 className="w-6 h-6 text-white" />
        </div>
        <span className="text-3xl font-black text-gray-800 tracking-tight">BaoCao</span>
      </div>
      <p className="text-gray-400 text-sm mb-14">Hệ thống nộp và trình chiếu báo cáo dự án</p>

      {/* Cards */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl">

        {/* Nộp báo cáo — Teal */}
        <button
          onClick={() => onSelect('submit')}
          className="flex-1 group relative overflow-hidden rounded-3xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg"
          style={{ background: 'linear-gradient(145deg, #0d9488, #0f766e)' }}
        >
          {/* Decorative circle */}
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.4)' }} />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.6)' }} />

          <div className="relative">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Nộp báo cáo</h2>
            <p className="text-teal-100 text-sm leading-relaxed mb-8">
              Tải lên hình ảnh, video và ghi chú cho dự án được giao.
            </p>
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              Bắt đầu nộp
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>

        {/* Trình chiếu — Indigo */}
        <button
          onClick={() => onSelect('present')}
          className="flex-1 group relative overflow-hidden rounded-3xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg"
          style={{ background: 'linear-gradient(145deg, #6366f1, #4f46e5)' }}
        >
          {/* Decorative circle */}
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20"
            style={{ background: 'rgba(255,255,255,0.4)' }} />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10"
            style={{ background: 'rgba(255,255,255,0.6)' }} />

          <div className="relative">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
              <Presentation className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Trình chiếu</h2>
            <p className="text-indigo-100 text-sm leading-relaxed mb-8">
              Xem và trình chiếu toàn màn hình báo cáo đã nộp cho đối tác.
            </p>
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              Bắt đầu trình chiếu
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>

      </div>

      <p className="text-gray-300 text-xs mt-10">© 2026 BaoCao · Hệ thống báo cáo dự án</p>
    </div>
  )
}
