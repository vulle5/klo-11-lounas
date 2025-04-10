/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Set your origin
          },
        ],
      },
    ];
  },
};
