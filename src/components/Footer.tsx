export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-slate-800 font-bold text-xs text-center">DDU</span>
            </div>
            <div className="text-sm">
              <p className="font-semibold">Deen Dayal Upadhyaya College</p>
              <p className="text-slate-300">University of Delhi</p>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-slate-300">
              ReUnite AI - Missing Person Identification System
            </p>
            <p className="text-xs text-slate-400 mt-1">
              &copy; {currentYear} All rights reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
