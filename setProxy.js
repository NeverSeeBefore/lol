module.exports = {
  '/api': {
    target: 'http://localhost:12306',
    changeOrigin: true,
    pathRewrite: {
      // '^/api': '',
    },
  },
};
