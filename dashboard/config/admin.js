module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '397cac2959a759a6e703b1e6160db9d2'),
  },
});
