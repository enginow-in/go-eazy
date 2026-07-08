export const Spinner = ({ page = false }) => (
  <div className={`min-h-screen flex items-center justify-center ${ page ? 'bg-gray-50' : '' }`}>
    <div className="w-10 h-10 border-4 border-[#CA3433] border-t-transparent rounded-full animate-spin" />
  </div>
)