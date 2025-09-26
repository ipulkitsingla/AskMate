import express from 'express';
import { body, validationResult } from 'express-validator';
import Answer from '../models/Answer.js';
import Question from '../models/Question.js';
import Class from '../models/Class.js';
import { authenticateToken, requireClassMember, requireClassTeacher } from '../middleware/auth.js';
import upload, { handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// @route   GET /api/answers/user/stats
// @desc    Get user's answer statistics
// @access  Private
router.get('/user/stats', authenticateToken, async (req, res) => {
  try {
    const count = await Answer.countDocuments({ 
      author: req.user._id, 
      isActive: true 
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Get answer stats error:', error);
    res.status(500).json({ message: 'Server error fetching answer stats' });
  }
});

// @route   GET /api/answers/question/:questionId
// @desc    Get all answers for a question
// @access  Private (Class members only)
router.get('/question/:questionId', authenticateToken, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    // First check if user has access to the question's class
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const classDoc = await Class.findById(question.classId);
    const isMember = classDoc.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
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
      default:
        sortOptions = { createdAt: -1 };
    }

    const answers = await Answer.find({ questionId, isActive: true })
      .populate('author', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add virtual fields
    const answersWithCounts = answers.map(a => ({
      ...a,
      voteCount: a.upvotes.length - a.downvotes.length
    }));

    const total = await Answer.countDocuments({ questionId, isActive: true });

    res.json({
      answers: answersWithCounts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get answers error:', error);
    res.status(500).json({ message: 'Server error fetching answers' });
  }
});

// @route   POST /api/answers/question/:questionId
// @desc    Create a new answer
// @access  Private (Class members only)
router.post('/question/:questionId', authenticateToken, upload.array('files', 5), handleUploadError, [
  body('text').trim().isLength({ min: 5, max: 2000 }).withMessage('Answer must be 5-2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { questionId } = req.params;
    const { text } = req.body;

    // Check if question exists and user has access
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const classDoc = await Class.findById(question.classId);
    const isMember = classDoc.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
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

    // Create answer
    const answer = new Answer({
      text,
      questionId,
      author: req.user._id,
      files
    });

    await answer.save();

    // Add answer to question
    question.answers.push(answer._id);
    await question.save();

    await answer.populate('author', 'name email');

    res.status(201).json({
      message: 'Answer created successfully',
      answer
    });
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({ message: 'Server error creating answer' });
  }
});

// @route   PUT /api/answers/:id
// @desc    Update answer
// @access  Private (Answer author or class teacher)
router.put('/:id', authenticateToken, [
  body('text').trim().isLength({ min: 5, max: 2000 }).withMessage('Answer must be 5-2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check permissions
    const isAuthor = answer.author.toString() === req.user._id.toString();
    
    // Get question and class to check teacher permissions
    const question = await Question.findById(answer.questionId);
    const classDoc = await Class.findById(question.classId);
    const isTeacher = classDoc.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.role === 'teacher'
    );

    if (!isAuthor && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized to edit this answer' });
    }

    const { text } = req.body;

    const updatedAnswer = await Answer.findByIdAndUpdate(
      req.params.id,
      { text },
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    res.json({
      message: 'Answer updated successfully',
      answer: updatedAnswer
    });
  } catch (error) {
    console.error('Update answer error:', error);
    res.status(500).json({ message: 'Server error updating answer' });
  }
});

// @route   POST /api/answers/:id/vote
// @desc    Vote on answer
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
    const answer = await Answer.findById(req.params.id);
    
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user has access to the question's class
    const question = await Question.findById(answer.questionId);
    const classDoc = await Class.findById(question.classId);
    const isMember = classDoc.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userId = req.user._id;

    // Remove existing votes
    answer.upvotes = answer.upvotes.filter(id => id.toString() !== userId.toString());
    answer.downvotes = answer.downvotes.filter(id => id.toString() !== userId.toString());

    // Add new vote if not removing
    if (type === 'upvote') {
      answer.upvotes.push(userId);
    } else if (type === 'downvote') {
      answer.downvotes.push(userId);
    }

    await answer.save();

    res.json({
      message: 'Vote updated successfully',
      voteCount: answer.upvotes.length - answer.downvotes.length
    });
  } catch (error) {
    console.error('Vote answer error:', error);
    res.status(500).json({ message: 'Server error voting on answer' });
  }
});

// @route   POST /api/answers/:id/accept
// @desc    Accept answer (mark as correct)
// @access  Private (Question author or class teacher)
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const question = await Question.findById(answer.questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check permissions
    const isQuestionAuthor = question.author.toString() === req.user._id.toString();
    const classDoc = await Class.findById(question.classId);
    const isTeacher = classDoc.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.role === 'teacher'
    );

    if (!isQuestionAuthor && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized to accept this answer' });
    }

    // Unaccept all other answers for this question
    await Answer.updateMany(
      { questionId: answer.questionId },
      { isAccepted: false }
    );

    // Accept this answer
    answer.isAccepted = true;
    await answer.save();

    // Mark question as resolved
    question.isResolved = true;
    await question.save();

    res.json({
      message: 'Answer accepted successfully',
      answer
    });
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({ message: 'Server error accepting answer' });
  }
});

// @route   DELETE /api/answers/:id
// @desc    Delete answer
// @access  Private (Answer author or class teacher)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check permissions
    const isAuthor = answer.author.toString() === req.user._id.toString();
    
    const question = await Question.findById(answer.questionId);
    const classDoc = await Class.findById(question.classId);
    const isTeacher = classDoc.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.role === 'teacher'
    );

    if (!isAuthor && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized to delete this answer' });
    }

    // Soft delete
    answer.isActive = false;
    await answer.save();

    // Remove from question's answers array
    await Question.findByIdAndUpdate(answer.questionId, {
      $pull: { answers: answer._id }
    });

    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Delete answer error:', error);
    res.status(500).json({ message: 'Server error deleting answer' });
  }
});

export default router;
