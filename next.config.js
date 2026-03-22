/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 🔴 أهم سطر: يخبر Next.js بتوليد ملفات ثابتة لجيت هاب
  images: {
    unoptimized: true, // جيت هاب لا يدعم معالجة الصور الخاصة بـ Next.js
  },
  // ⚠️ ملاحظة هامة: قم بإزالة الـ // من السطر القادم واكتب اسم الريبو بتاعك لو المشروع مش على الدومين الرئيسي
  // basePath: '/Eduneers-Dashboard', 
};

export default nextConfig;
