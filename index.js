const adminDrops = require('./admin-drops');
const publicState = require('./public-state');
const createCheckout = require('./create-checkout');
const verifyAccess = require('./verify-access');
const health = require('./health');

module.exports = async (req, res) => {
  const raw = (req.url || '').split('?')[0].replace(/\/+$/, '');
  const path = raw.toLowerCase();

  if (path.endsWith('/admin-drops') || path.endsWith('/admin')) return adminDrops(req, res);
  if (path.endsWith('/public-state')) return publicState(req, res);
  if (path.endsWith('/create-checkout')) return createCheckout(req, res);
  if (path.endsWith('/verify-access')) return verifyAccess(req, res);
  if (path.endsWith('/health') || path === '/api' || path === '/api/index') return health(req, res);

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify({ error: 'Unknown Phantom API route', path: raw }));
};