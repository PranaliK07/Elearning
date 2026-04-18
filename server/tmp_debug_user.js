const { User, sequelize } = require('./models');
(async () => {
  try {
    await sequelize.authenticate();
    const any = await User.findOne();
    if (!any) {
      console.log('any user: none');
    } else {
      console.log('any user:', any.email, '/', any.id);
    }
    process.exit(0);
  } catch (err) {
    console.error(err.stack || err);
    process.exit(1);
  }
})();
