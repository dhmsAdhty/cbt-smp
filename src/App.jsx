import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function App() {
  const [countdown, setCountdown] = useState(10);
  const newUrl = "https://cbt-ats.pages.dev";

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = newUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans text-slate-800">
      
      {/* Subtle Background Elements */}
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-blue-50 to-transparent z-0"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] relative z-10 text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 border border-blue-100 rounded-2xl mx-auto flex items-center justify-center mb-8 shadow-sm"
        >
          <svg className="w-8 h-8 md:w-10 md:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0v12m0-12l-14 14" />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold mb-6 tracking-widest uppercase">
            Pembaruan Sistem CBT
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-slate-900">
            Sistem Telah Dipindahkan
          </h1>
          
          <p className="text-slate-600 text-base md:text-lg mb-8 leading-relaxed font-normal">
            Situs CBT telah dialihkan dari <span className="text-slate-400 line-through">cbt-smp.pages.dev</span> ke alamat baru.
          </p>

          <div className="bg-slate-50/80 rounded-2xl p-6 mb-8 border border-slate-100">
            <p className="text-xs text-slate-500 mb-2 font-medium tracking-widest uppercase">Alamat Baru</p>
            <p className="text-2xl md:text-3xl font-medium text-blue-600 tracking-wide break-all">
              cbt-ats.pages.dev
            </p>
          </div>

          <a 
            href={newUrl}
            className="group relative inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-medium rounded-xl overflow-hidden transition-all hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-600/20"
          >
            <span className="relative z-10 flex items-center gap-2">
              Lanjutkan
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </a>

          <p className="mt-8 text-xs text-slate-500 font-normal tracking-wide">
            Mengalihkan otomatis dalam <span className="font-semibold text-slate-700">{countdown}</span> detik
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default App;