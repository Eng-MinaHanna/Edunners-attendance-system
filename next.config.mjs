/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // السطر ده هو اللي بيظبط مسار التصميم
  basePath: '/Eduneers-attendance-system', 
};

export default nextConfig;
