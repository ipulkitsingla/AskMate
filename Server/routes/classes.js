import express from 'express';
import { body, validationResult } from 'express-validator';
import Class from '../models/Class.js';
import User from '../models/User.js';
import { authenticateToken, requireRole, requireClassMember, requireClassTeacher } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/classes/create
// @desc    Create a new class
// @access  Private (Teachers and Admins)
router.post('/create', authenticateToken, requireRole(['teacher', 'admin']), [
  body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Class name must be 3-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description } = req.body;

    // Create new class
    const newClass = new Class({
      name,
      description,
      createdBy: req.user._id
    });

    await newClass.save();

    // Add class to user's created classes
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdClasses: newClass._id }
    });

    // Populate the class with creator info
    await newClass.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Class created successfully',
      class: newClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: 'Server error creating class' });
  }
});

// @route   POST /api/classes/join
// @desc    Join a class using class code
// @access  Private
router.post('/join', authenticateToken, [
  body('classCode').trim().isLength({ min: 6, max: 6 }).withMessage('Class code must be exactly 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { classCode } = req.body;

    // Find class by code
    const classDoc = await Class.findOne({ classCode: classCode.toUpperCase() });
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found with this code' });
    }

    if (!classDoc.isActive) {
      return res.status(400).json({ message: 'This class is no longer active' });
    }

    // Check if user is already a member
    const isAlreadyMember = classDoc.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: 'You are already a member of this class' });
    }

    // Add user to class members
    classDoc.members.push({
      user: req.user._id,
      role: 'student'
    });

    await classDoc.save();

    // Add class to user's joined classes
    await User.findByIdAndUpdate(req.user._id, {
      $push: { joinedClasses: classDoc._id }
    });

    // Populate class data
    await classDoc.populate('createdBy', 'name email');
    await classDoc.populate('members.user', 'name email role');

    res.json({
      message: 'Successfully joined class',
      class: classDoc
    });
  } catch (error) {
    console.error('Join class error:', error);
    res.status(500).json({ message: 'Server error joining class' });
  }
});

// @route   GET /api/classes
// @desc    Get user's classes
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'joinedClasses',
        populate: {
          path: 'createdBy',
          select: 'name email'
        }
      })
      .populate({
        path: 'createdClasses',
        populate: {
          path: 'createdBy',
          select: 'name email'
        }
      });

    res.json({
      joinedClasses: user.joinedClasses,
      createdClasses: user.createdClasses
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error fetching classes' });
  }
});

// @route   GET /api/classes/:id
// @desc    Get class details
// @access  Private (Class members only)
router.get('/:id', authenticateToken, requireClassMember, async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email role');

    res.json({ class: classDoc });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Server error fetching class' });
  }
});

// @route   PUT /api/classes/:id
// @desc    Update class settings
// @access  Private (Class teachers only)
router.put('/:id', authenticateToken, requireClassTeacher, [
  body('name').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Class name must be 3-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, settings } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (settings) updateData.settings = { ...req.class.settings, ...settings };

    const classDoc = await Class.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      message: 'Class updated successfully',
      class: classDoc
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: 'Server error updating class' });
  }
});

// @route   DELETE /api/classes/:id/members/:userId
// @desc    Remove member from class
// @access  Private (Class teachers only)
router.delete('/:id/members/:userId', authenticateToken, requireClassTeacher, async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow removing the creator
    if (req.class.createdBy.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove class creator' });
    }

    // Remove member from class
    req.class.members = req.class.members.filter(
      member => member.user.toString() !== userId
    );

    await req.class.save();

    // Remove class from user's joined classes
    await User.findByIdAndUpdate(userId, {
      $pull: { joinedClasses: req.class._id }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error removing member' });
  }
});

// @route   DELETE /api/classes/:id
// @desc    Delete class
// @access  Private (Class creator only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classDoc.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only class creator can delete the class' });
    }

    // Remove class from all members' joined classes
    await User.updateMany(
      { joinedClasses: req.params.id },
      { $pull: { joinedClasses: req.params.id } }
    );

    // Delete the class
    await Class.findByIdAndDelete(req.params.id);

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error deleting class' });
  }
});

export default router;
