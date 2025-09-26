import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiMessageSquare, FiClock, FiEye, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ClassPage.css';

const ClassPage = () => {
  const { id } = useParams();
  const [classData, setClassData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchClassData();
    fetchQuestions();
  }, [id]);

  const fetchClassData = async () => {
    try {
      const response = await axios.get(`/classes/${id}`);
      setClassData(response.data.class);
    } catch (error) {
      console.error('Error fetching class data:', error);
      
      if (error.response?.status === 404) {
        toast.error('Class not found. It may have been deleted or you may not have access to it.');
        // Debug: Check if class exists
        try {
          const debugResponse = await axios.get(`/classes/check/${id}`);
          console.log('Debug - Class exists:', debugResponse.data);
        } catch (debugError) {
          console.log('Debug - Class does not exist:', debugError.response?.data);
        }
      } else if (error.response?.status === 403) {
        toast.error('You are not a member of this class. Please join the class first.');
      } else {
        toast.error('Failed to load class data');
      }
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`/questions/class/${id}`, {
        params: { search: searchTerm, sort: sortBy }
      });
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm !== '' || sortBy !== 'newest') {
      fetchQuestions();
    }
  }, [searchTerm, sortBy]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading class...</p>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="error-container">
        <h2>Class not found</h2>
        <p>The class you're looking for doesn't exist or you don't have access to it.</p>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="class-page">
      <div className="class-header">
        <div className="class-info">
          <h1>{classData.name}</h1>
          {classData.description && (
            <p className="class-description">{classData.description}</p>
          )}
          <div className="class-meta">
            <span className="class-code">Code: {classData.classCode}</span>
            <span className="member-count">
              {classData.members?.length || 0} members
            </span>
          </div>
        </div>
        
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          <FiPlus className="icon" />
          Ask Question
        </button>
      </div>

      <div className="class-content">
        <div className="questions-header">
          <h2>Questions</h2>
          
          <div className="questions-controls">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="sort-dropdown">
              <FiFilter className="filter-icon" />
              <select value={sortBy} onChange={handleSortChange}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="mostVoted">Most Voted</option>
                <option value="mostAnswered">Most Answered</option>
              </select>
            </div>
          </div>
        </div>

        <div className="questions-list">
          {questions.length === 0 ? (
            <div className="empty-state">
              <FiMessageSquare className="empty-icon" />
              <h3>No questions yet</h3>
              <p>Be the first to ask a question in this class!</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                Ask First Question
              </button>
            </div>
          ) : (
            questions.map(question => (
              <QuestionCard key={question._id} question={question} />
            ))
          )}
        </div>
      </div>

      {showCreateForm && (
        <CreateQuestionModal
          classId={id}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchQuestions();
          }}
        />
      )}
    </div>
  );
};

const QuestionCard = ({ question }) => {
  const handleVote = async (type) => {
    try {
      await axios.post(`/questions/${question._id}/vote`, { type });
      // Refresh questions or update state
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  return (
    <div className="question-card">
      <div className="question-header">
        <Link to={`/question/${question._id}`} className="question-title">
          {question.title}
        </Link>
        <div className="question-tags">
          {question.tags?.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
      </div>
      
      <p className="question-description">
        {question.description.substring(0, 200)}
        {question.description.length > 200 && '...'}
      </p>
      
      <div className="question-meta">
        <div className="question-author">
          by {question.author?.name}
        </div>
        
        <div className="question-stats">
          <span className="stat">
            <FiMessageSquare className="icon" />
            {question.answerCount || 0} answers
          </span>
          <span className="stat">
            <FiEye className="icon" />
            {question.views || 0} views
          </span>
          <span className="stat">
            <FiClock className="icon" />
            {format(new Date(question.createdAt), 'MMM d, yyyy')}
          </span>
        </div>
      </div>
      
      <div className="question-actions">
        <div className="vote-buttons">
          <button
            className="vote-btn upvote"
            onClick={() => handleVote('upvote')}
          >
            <FiThumbsUp className="icon" />
            {question.upvotes?.length || 0}
          </button>
          <button
            className="vote-btn downvote"
            onClick={() => handleVote('downvote')}
          >
            <FiThumbsDown className="icon" />
            {question.downvotes?.length || 0}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateQuestionModal = ({ classId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  const handleClose = () => {
    setValidationErrors({});
    onClose();
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters';
    } else if (formData.title.trim().length > 200) {
      errors.title = 'Title cannot exceed 200 characters';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await axios.post(`/questions/class/${classId}`, {
        title: formData.title,
        description: formData.description,
        tags
      });

      toast.success('Question created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Question creation error:', error);
      
      if (error.response?.data?.errors) {
        // Show specific validation errors
        const validationErrors = error.response.data.errors;
        validationErrors.forEach(err => {
          toast.error(`${err.path}: ${err.msg}`);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to create question');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Ask a Question</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">Question Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="What's your question?"
              className={validationErrors.title ? 'error' : ''}
              required
            />
            {validationErrors.title && (
              <span className="error-message">{validationErrors.title}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide more details about your question..."
              rows="5"
              className={validationErrors.description ? 'error' : ''}
              required
            />
            {validationErrors.description && (
              <span className="error-message">{validationErrors.description}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., homework, math, urgent"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Ask Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassPage;
