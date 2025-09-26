import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Authentication error' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireClassMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const Class = (await import('../models/Class.js')).default;
    const classDoc = await Class.findById(id);
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const isMember = classDoc.members.some(member => 
      member.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this class' });
    }

    req.class = classDoc;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error verifying class membership' });
  }
};

export const requireClassTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const Class = (await import('../models/Class.js')).default;
    const classDoc = await Class.findById(id);
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const isTeacher = classDoc.members.some(member => 
      member.user.toString() === userId.toString() && member.role === 'teacher'
    );

    if (!isTeacher) {
      return res.status(403).json({ message: 'Teacher access required' });
    }

    req.class = classDoc;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error verifying teacher access' });
  }
};
