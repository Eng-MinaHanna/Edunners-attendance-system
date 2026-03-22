"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// تسجيل مكونات Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// روابط الـ APIs
const ATTEND_API = "https://script.google.com/macros/s/AKfycbyQlZlxpCyr68rjjsxGmXrPcLk0X7agsGEpG6YaGGNZwTvPY3sSbx2td5blRPP6oqbfhg/exec";
const GRADES_API = "https://script.google.com/macros/s/AKfycbzJkCGpIcc6uzgITufJcDnv8yC2RvF-DTlX1rw-9ZojdHmQyj2GSHsPFFAKCOiWV4Q/exec";
const EXTRA_API = "https://script.google.com/macros/s/AKfycbz06d7stdEv5_4m529xIKToSNiR-_pciUDFcdhFQXA7RrE9rt_Puv8dhBdpR4V5L3XioQ/exec";

export default function ComparisonDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadPercent, setLoadPercent] = useState(0);
  const [groupsData, setGroupsData] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [toastMsg, setToastMsg] = useState("");

  const [topMetrics, setTopMetrics] = useState({
    attendance: "---",
    tasks: "---",
    feedback: "---",
  });

  // محاكاة مؤشر التحميل
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadPercent((prev) => {
          const next = prev + Math.floor(Math.random() * 12) + 2;
          return next > 98 ? 98 : next;
        });
      }, 100);
    } else {
      setLoadPercent(100);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // جلب البيانات عند بدء التشغيل
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setLoadPercent(0);
    
    // محاكاة للتحقق من تسجيل الدخول (استبدلها بمنطقك الخاص)
    const isLoggedIn = typeof window !== 'undefined' ? localStorage.getItem('isLoggedIn') === 'true' : false;
    if (!isLoggedIn) {
        // window.location.href = '/';
        // return;
    }

    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') || '' : '';
    const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') || '' : '';
    const auth = `&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

    const fetchOptions = {
      method: "GET",
      mode: "cors",
      redirect: "follow",
    };

    try {
      const [resAtt, resGrd, resExt] = await Promise.all([
        fetch(`${ATTEND_API}?action=getComparisonData${auth}`, fetchOptions).then((r) => r.json()),
        fetch(`${GRADES_API}?action=getComparisonData${auth}`, fetchOptions).then((r) => r.json()),
        fetch(`${EXTRA_API}?action=getComparisonData${auth}`, fetchOptions).then((r) => r.json()),
      ]);

      if (resAtt.status === "success") {
        mergeAndRender(resAtt.data, resGrd.data || [], resExt.data || []);
        showToast("تم تحديث البيانات بنجاح 📡");
      } else {
        alert("خطأ في البيانات المسترجعة: " + (resAtt.message || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("❌ خطأ تقني في الربط. تأكد من إعدادات الـ Apps Script.");
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const mergeAndRender = (att, grd, ext) => {
    const map = {};
    att.forEach((i) => (map[i.name] = { name: i.name, att: i.attendance || 0, tsk: 0, fbk: 0 }));
    grd.forEach((i) => { if (map[i.name]) map[i.name].tsk = i.tasks || 0; });
    ext.forEach((i) => { if (map[i.name]) map[i.name].fbk = i.feedback || 0; });

    const mergedData = Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
    setGroupsData(mergedData);

    // اختيار أول 5 جروبات افتراضياً للرسم البياني
    const initialSelection = mergedData.slice(0, 5).map((g) => g.name);
    setSelectedGroups(initialSelection);

    // حساب أفضل الأداء
    const sortedByAtt = [...mergedData].sort((a, b) => b.att - a.att);
    const sortedByTsk = [...mergedData].sort((a, b) => b.tsk - a.tsk);
    const sortedByFbk = [...mergedData].sort((a, b) => b.fbk - a.fbk);

    setTopMetrics({
      attendance: sortedByAtt[0]?.name || "--",
      tasks: sortedByTsk[0]?.name || "--",
      feedback: sortedByFbk[0]?.name || "--",
    });
  };

  const handleCheckboxChange = (groupName) => {
    setSelectedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((name) => name !== groupName)
        : [...prev, groupName]
    );
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // إعداد بيانات الـ Chart
  const chartData = {
    labels: groupsData.filter((g) => selectedGroups.includes(g.name)).map((g) => g.name),
    datasets: [
      {
        label: "متوسط الحضور (15)",
        data: groupsData.filter((g) => selectedGroups.includes(g.name)).map((g) => g.att),
        backgroundColor: "rgba(14, 165, 233, 0.8)",
        borderColor: "#0ea5e9",
        borderWidth: 1,
        borderRadius: 5,
      },
      {
        label: "متوسط التاسكات (70)",
        data: groupsData.filter((g) => selectedGroups.includes(g.name)).map((g) => g.tsk),
        backgroundColor: "rgba(245, 176, 65, 0.8)",
        borderColor: "#f5b041",
        borderWidth: 1,
        borderRadius: 5,
      },
      {
        label: "متوسط الإضافات (10)",
        data: groupsData.filter((g) => selectedGroups.includes(g.name)).map((g) => g.fbk),
        backgroundColor: "rgba(168, 85, 247, 0.8)",
        borderColor: "#a855f7",
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#9ca3af", font: { family: "Cairo", weight: "bold" } } },
      tooltip: { backgroundColor: "rgba(3, 7, 18, 0.9)", titleFont: { family: "Cairo" }, bodyFont: { family: "Cairo" } },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6b7280" } },
      x: { grid: { display: false }, ticks: { color: "#f3f4f6", font: { family: "Cairo", weight: "bold" } } },
    },
  };

  // التأثيرات الانتقالية (Framer Motion)
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#030712] text-gray-100 font-['Cairo'] relative overflow-x-hidden pb-10">
      
      {/* 🏎️ Animated Grid Background */}
      <div className="fixed inset-0 z-[-1] opacity-50 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:30px_30px]" />
      <div className="fixed inset-0 z-[-2] bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.1)_0%,transparent_50%),radial-gradient(circle_at_10%_20%,rgba(245,176,65,0.05)_0%,transparent_30%)]" />

      {/* 📡 Loader Section */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#030712]"
          >
            <div className="text-sky-500 font-black tracking-widest mb-5">EDUNEERS CORE ANALYTICS</div>
            <div className="relative w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 h-full bg-sky-500 shadow-[0_0_15px_#0ea5e9]"
                initial={{ width: 0 }}
                animate={{ width: `${loadPercent}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
              />
            </div>
            <div className="mt-4 font-mono text-amber-400">
              {loadPercent < 100 ? `CALCULATING... ${loadPercent}%` : "CALCULATION COMPLETE 100%"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💎 Header */}
      <header className="border-b border-white/10 py-5 mb-8">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h3 className="m-0 font-bold tracking-wide text-2xl">
              ⚡ EDUNEERS <span className="text-sky-500">QUANTUM</span>
            </h3>
            <span className="text-[10px] opacity-50 font-mono">VER 3.0 // REACT_MODULE</span>
          </div>
          <div className="flex gap-2">
            <a href="/grades" className="px-4 py-2 rounded-lg bg-white/5 font-bold hover:bg-sky-500 hover:shadow-[0_0_15px_#0ea5e9] transition-all">🎯 التقييم</a>
            <a href="/" className="px-4 py-2 rounded-lg bg-white/5 font-bold hover:bg-sky-500 hover:shadow-[0_0_15px_#0ea5e9] transition-all">🏠 الحضور</a>
          </div>
        </div>
      </header>

      <motion.main
        className="container mx-auto px-4"
        variants={containerVariants}
        initial="hidden"
        animate={!isLoading ? "visible" : "hidden"}
      >
        {/* 🏆 Master Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div variants={itemVariants} className="bg-gray-900/70 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center hover:-translate-y-1 hover:border-sky-500 hover:shadow-[0_10px_40px_rgba(14,165,233,0.2)] transition-all">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">أعلى معدل حضور</span>
            <div className="font-mono text-3xl font-black text-sky-500 drop-shadow-[0_0_10px_#0ea5e9] mt-2">
              <AnimatePresence mode="wait">
                <motion.span key={topMetrics.attendance} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{topMetrics.attendance}</motion.span>
              </AnimatePresence>
            </div>
            <div className="text-[10px] text-emerald-500 mt-2">STABLE UPTIME ✅</div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gray-900/70 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center hover:-translate-y-1 hover:border-amber-400 hover:shadow-[0_10px_40px_rgba(245,176,65,0.2)] transition-all">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">بطل المهمات (Tasks)</span>
            <div className="font-mono text-3xl font-black text-amber-400 drop-shadow-[0_0_10px_#f5b041] mt-2">
               <AnimatePresence mode="wait">
                <motion.span key={topMetrics.tasks} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{topMetrics.tasks}</motion.span>
              </AnimatePresence>
            </div>
            <div className="text-[10px] text-amber-400 mt-2">PEAK PRODUCTION 🛠️</div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gray-900/70 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center hover:-translate-y-1 hover:border-purple-500 hover:shadow-[0_10px_40px_rgba(168,85,247,0.2)] transition-all">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">الأكثر تفاعلاً (FB)</span>
            <div className="font-mono text-3xl font-black text-purple-500 drop-shadow-[0_0_10px_#a855f7] mt-2">
               <AnimatePresence mode="wait">
                <motion.span key={topMetrics.feedback} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{topMetrics.feedback}</motion.span>
              </AnimatePresence>
            </div>
            <div className="text-[10px] text-purple-500 mt-2">ACTIVE FREQUENCY 📡</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 🎛️ Group Filter Panel */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="bg-gray-900/70 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h6 className="font-bold text-amber-400 mb-4">📡 المجموعات النشطة</h6>
              <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {groupsData.length === 0 ? (
                  <div className="text-center py-4 opacity-50">جاري مسح الشبكة...</div>
                ) : (
                  groupsData.map((g) => (
                    <div
                      key={g.name}
                      className="flex items-center gap-3 p-2.5 rounded-xl mb-2 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => handleCheckboxChange(g.name)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(g.name)}
                        onChange={() => {}} // Handle in the parent div
                        className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-sky-500 focus:ring-sky-500 focus:ring-offset-gray-900"
                      />
                      <label className={`text-sm font-bold cursor-pointer ${selectedGroups.includes(g.name) ? 'text-sky-500' : 'text-gray-300'}`}>
                        {g.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={fetchData}
                className="w-full mt-6 py-2 rounded-lg border border-sky-500 text-sky-500 font-bold hover:bg-sky-500 hover:text-white transition-colors"
              >
                🔄 إعادة المزامنة
              </button>
            </div>
          </motion.div>

          {/* 📈 Main Visualizer & Table */}
          <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
            <div className="bg-gray-900/70 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h6 className="font-bold text-sky-400 m-0">📈 توزيع الأداء الميداني</h6>
                <div className="text-[9px] opacity-50 font-mono bg-white/10 px-2 py-1 rounded">REAL-TIME DATA STREAM</div>
              </div>
              <div className="h-[350px]">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-gray-900/70 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h6 className="font-bold text-sky-400 mb-6">📊 جدول تحليل الكفاءة الكمي</h6>
              <div className="overflow-x-auto">
                <table className="w-full text-center border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="p-3 text-amber-400 text-xs tracking-wider">المجموعة</th>
                      <th className="p-3 text-amber-400 text-xs tracking-wider">متوسط الحضور</th>
                      <th className="p-3 text-amber-400 text-xs tracking-wider">متوسط التاسكات</th>
                      <th className="p-3 text-amber-400 text-xs tracking-wider">متوسط الفيدباك</th>
                      <th className="p-3 text-amber-400 text-xs tracking-wider">مؤشر الكفاءة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupsData.map((g) => {
                      const efficiency = Math.min(100, Math.round(((g.att + g.tsk + g.fbk) / 95) * 100));
                      return (
                        <tr key={g.name} className="bg-white/5 hover:bg-white/10 transition-colors group">
                          <td className="p-4 border-y border-l border-white/5 rounded-r-xl">
                            <div className="flex items-center justify-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_10px_#0ea5e9] animate-pulse" />
                              <span className="font-bold">{g.name}</span>
                            </div>
                          </td>
                          <td className="p-4 border-y border-white/5">{g.att.toFixed(1)}</td>
                          <td className="p-4 border-y border-white/5">{g.tsk.toFixed(1)}</td>
                          <td className="p-4 border-y border-white/5">{g.fbk.toFixed(1)}</td>
                          <td className="p-4 border-y border-r border-white/5 rounded-l-xl">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${efficiency > 75 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-amber-500/20 text-amber-400 border border-amber-500/50'}`}>
                              {efficiency}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-5 right-5 bg-amber-400 text-black px-6 py-3 rounded-xl font-black shadow-lg z-[10000]"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ستايل مخصص للـ Scrollbar الخاصة بقائمة الجروبات */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #0ea5e9; border-radius: 10px; }
      `}} />
    </div>
  );
}
