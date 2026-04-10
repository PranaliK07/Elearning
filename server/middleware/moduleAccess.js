const { RoleAccess } = require('../models');

const parseModules = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

// Enforce Business Settings (role-based sidebar access) on API routes.
// If RoleAccess is not seeded yet, this middleware defaults to allowing access.
const requireModuleAccess = (moduleKey) => {
  return async (req, res, next) => {
    try {
      const role = req.user?.role;
      if (!role) return res.status(401).json({ message: 'Not authorized' });

      const record = await RoleAccess.findOne({ where: { role } });
      if (!record) return next();

      const modules = parseModules(record.modules);
      if (!modules.includes(moduleKey)) {
        return res.status(403).json({ message: 'Access denied. Module disabled in Business Settings.' });
      }

      return next();
    } catch (error) {
      console.error('Module access check error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = requireModuleAccess;

