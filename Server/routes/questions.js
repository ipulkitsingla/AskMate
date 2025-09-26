import express from 'express';
import { body, validationResult } from 'express-validator';
import Question from '../models/Question.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import { authenticateToken, requireClassMember, requireClassTeacher } from '../middleware/auth.js';
import upload, { handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// @route   GET /api/questions/class/:classId
// @desc    Get all questions for a class
// @access  Private (Class members only)
router.get('/class/:classId', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 10, search, tag, sort = 'newest' } = req.query;

    console.log('Fetching questions for class:', classId, 'user:', userId);

    // Check if user is member of the class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      console.log('Class not found for questions:', classId);
      return res.status(404).json({ message: 'Class not found' });
    }

    const isMember = classDoc.members.some(member => 
      member.user.toString() === userId.toString()
    );

    if (!isMember) {
      console.log('User not a member of class for questions:', userId, classId);
      return res.status(403).json({ message: 'You are not a member of this class' });
    }

    // Build query
    let query = { classId, isActive: true };

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Add tag filter
    if (tag) {
      query.tags = { $in: [new RegExp(tag, 'i')] };
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'mostVoted':
        sortOptions = { upvotes: -1, createdAt: -1 };
        break;
      case 'mostAnswered':
        sortOptions = { answers: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const questions = await Question.find(query)
      .populate('author', 'name email')
      .populate('answers')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add virtual fields
    const questionsWithCounts = questions.map(q => ({
      ...q,
      voteCount: q.upvotes.length - q.downvotes.length,
      answerCount: q.answers.length
    }));

    const total = await Question.countDocuments(query);

    res.json({
      questions: questionsWithCounts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Server error fetching questions' });
  }
});

// @route   GET /api/questions/recent
// @desc    Get recent questions across all user's classes
// @access  Private
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Get user's classes
    const user = await User.findById(req.user._id).populate('joinedClasses');
    const classIds = user.joinedClasses.map(c => c._id);

    const questions = await Question.find({ 
      classId: { $in: classIds }, 
      isActive: true 
    })
      .populate('author', 'name email')
      .populate('classId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ questions });
  } catch (error) {
    console.error('Get recent questions error:', error);
    res.status(500).json({ message: 'Server error fetching recent questions' });
  }
});

// @route   GET /api/questions/user/stats
// @desc    Get user's question statistics
// @access  Private
router.get('/user/stats', authenticateToken, async (req, res) => {
  try {
    const count = await Question.countDocuments({ 
      author: req.user._id, 
      isActive: true 
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Get question stats error:', error);
    res.status(500).json({ message: 'Server error fetching question stats' });
  }
});

// @route   GET /api/questions/:id
// @desc    Get single question
// @access  Private (Class members only)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('author', 'name email')
      .populate({
        path: 'answers',
        populate: {
          path: 'author',
          select: 'name email'
        }
      })
      .populate('upvotes', 'name')
      .populate('downvotes', 'name');

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user is member of the class
    const classDoc = await Class.findById(question.classId);
    const isMember = classDoc.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Increment view count
    question.views += 1;
    await question.save();

    res.json({ question });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ message: 'Server error fetching question' });
  }
});

// @route   POST /api/questions/class/:classId
// @desc    Create a new question
// @access  Private (Class members only)
router.post('/class/:classId', authenticateToken, upload.array('files', 5), handleUploadError, [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('tags').optional().custom((value) => {
    if (Array.isArray(value) || typeof value === 'string') {
      return true;
    }
    throw new Error('Tags must be an array or string');
  }).withMessage('Tags must be an array or string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { classId } = req.params;
    const userId = req.user._id;
    const { title, description, tags = [] } = req.body;

    console.log('Creating question for class:', classId, 'user:', userId);
    console.log('Question data:', { title, description, tags });

    // Check if user is member of the class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      console.log('Class not found for question creation:', classId);
      return res.status(404).json({ message: 'Class not found' });
    }

    const isMember = classDoc.members.some(member => 
      member.user.toString() === userId.toString()
    );

    if (!isMember) {
      console.log('User not a member of class for question creation:', userId, classId);
      return res.status(403).json({ message: 'You are not a member of this class' });
    }

    // Check class settings for file uploads
    if (req.files && req.files.length > 0 && !classDoc.settings.allowFileUploads) {
      return res.status(400).json({ message: 'File uploads are not allowed in this class' });
    }

    // Process uploaded files
    const files = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    })) : [];

    // Process tags - handle both string and array inputs
    let processedTags = [];
    if (Array.isArray(tags)) {
      processedTags = tags.filter(tag => tag && tag.trim().length > 0);
    } else if (typeof tags === 'string') {
      processedTags = tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }

    // Create question
    const question = new Question({
      title,
      description,
      tags: processedTags,
      classId,
      author: req.user._id,
      files
    });

    await question.save();
    await question.populate('author', 'name email');

    res.status(201).json({
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    console.error('Create question error:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Server error creating question' });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update question
// @access  Private (Question author or class teacher)
router.put('/:id', authenticateToken, [
  body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check permissions
    const isAuthor = question.author.toString() === req.user._id.toString();
    const classDoc = await Class.findById(question.classId);
    const isTeacher = classDoc.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.role === 'teacher'
    );

    if (!isAuthor && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized to edit this question' });
    }

    const { title, description, tags } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (tags) updateData.tags = tags.filter(tag => tag.trim().length > 0);

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    res.json({
      message: 'Question updated successfully',
      question: updatedQuestion
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ message: 'Server error updating question' });
  }
});

// @route   POST /api/questions/:id/vote
// @desc    Vote on question
// @access  Private (Class members only)
router.post('/:id/vote', authenticateToken, [
  body('type').isIn(['upvote', 'downvote', 'remove']).withMessage('Vote type must be upvote, downvote, or remove')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { type } = req.body;
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user is member of the class
    const classDoc = await Class.findById(question.classId);
    const isMember = classDoc.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userId = req.user._id;

    // Remove existing votes
    question.upvotes = question.upvotes.filter(id => id.toString() !== userId.toString());
    question.downvotes = question.downvotes.filter(id => id.toString() !== userId.toString());

    // Add new vote if not removing
    if (type === 'upvote') {
      question.upvotes.push(userId);
    } else if (type === 'downvote') {
      question.downvotes.push(userId);
    }

    await question.save();

    res.json({
      message: 'Vote updated successfully',
      voteCount: question.upvotes.length - question.downvotes.length
    });
  } catch (error) {
    console.error('Vote question error:', error);
    res.status(500).json({ message: 'Server error voting on question' });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete question
// @access  Private (Question author or class teacher)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check permissions
    const isAuthor = question.author.toString() === req.user._id.toString();
    const classDoc = await Class.findById(question.classId);
    const isTeacher = classDoc.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.role === 'teacher'
    );

    if (!isAuthor && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized to delete this question' });
    }

    // Soft delete
    question.isActive = false;
    await question.save();

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Server error deleting question' });
  }
});

export default router;