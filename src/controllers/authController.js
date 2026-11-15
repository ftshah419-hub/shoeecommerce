const authService = require('../services/authService');

class AuthController {
  renderLogin(req, res) {
    if (req.user) {
      return res.redirect(req.user.role === 'admin' ? '/admin/dashboard' : '/');
    }
    res.render('auth/login', {
      title: 'Login - Neleeri Sneakers',
      error: req.query.error || null,
      success: req.query.success || null,
      redirect: req.query.redirect || '',
    });
  }

  renderRegister(req, res) {
    if (req.user) {
      return res.redirect('/');
    }
    res.render('auth/register', {
      title: 'Register - Neleeri Sneakers',
      error: req.query.error || null,
    });
  }

  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const { token, user } = await authService.register({ name, email, password });

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax',
      });

      if (req.is('json') || req.xhr) {
        return res.json({ success: true, user, token });
      }

      res.redirect('/?welcome=true');
    } catch (error) {
      if (req.is('json') || req.xhr) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.render('auth/register', {
        title: 'Register - Neleeri Sneakers',
        error: error.message,
      });
    }
  }

  async login(req, res, next) {
    try {
      const { email, password, redirect } = req.body;
      const { token, user } = await authService.login({ email, password });

      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax',
      });

      if (req.is('json') || req.xhr) {
        return res.json({ success: true, user, token });
      }

      if (redirect && redirect.startsWith('/')) {
        return res.redirect(redirect);
      }

      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      }

      res.redirect('/');
    } catch (error) {
      if (req.is('json') || req.xhr) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.render('auth/login', {
        title: 'Login - Neleeri Sneakers',
        error: error.message,
        success: null,
        redirect: req.body.redirect || '',
      });
    }
  }

  logout(req, res) {
    res.clearCookie('token');
    if (req.is('json') || req.xhr) {
      return res.json({ success: true, message: 'Logged out successfully.' });
    }
    res.redirect('/auth/login?success=Logged out successfully.');
  }
}

module.exports = new AuthController();
