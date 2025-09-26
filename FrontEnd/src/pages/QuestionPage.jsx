import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiThumbsUp, FiThumbsDown, FiMessageSquare, FiClock, FiUser, FiCheck, FiPaperclip } from 'react-icons/fi';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import './QuestionPage.css';

const QuestionPage = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  useEffect(() => {
    fetchQuestionData();
  }, [id]);

  const fetchQuestionData = async () => {
    try {
      const [questionResponse, answersResponse] = await Promise.all([
        axios.get(`/questions/${id}`),
        axios.get(`/answers/question/${id}`)
      ]);
      
      setQuestion(questionResponse.data.question);
      setAnswers(answersResponse.data.answers);
    } catch (error) {
      console.error('Error fetching question data:', error);
      toast.error('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionVote = async (type) => {
    try {
      await axios.post(`/questions/${id}/vote`, { type });
      fetchQuestionData(); // Refresh data
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleAnswerVote = async (answerId, type) => {
    try {
      await axios.post(`/answers/${answerId}/vote`, { type });
      fetchQuestionData(); // Refresh data
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await axios.post(`/answers/${answerId}/accept`);
      fetchQuestionData(); // Refresh data
      toast.success('Answer accepted!');
    } catch (error) {
      toast.error('Failed to accept answer');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading question...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="error-container">
        <h2>Question not found</h2>
        <p>The question you're looking for doesn't exist or you don't have access to it.</p>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="question-page">
      <div className="question-container">
        <div className="question-header">
          <h1>{question.title}</h1>
          <div className="question-tags">
            {question.tags?.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        <div className="question-content">
          <div className="question-body">
            <p>{question.description}</p>
            
            {question.files && question.files.length > 0 && (
              <div className="question-files">
                <h4>Attachments:</h4>
                <div className="files-list">
                  {question.files.map((file, index) => (
                    <a
                      key={index}
                      href={`http://localhost:5000/uploads/${file.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      <FiPaperclip className="icon" />
                      {file.originalName}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="question-sidebar">
            <div className="vote-section">
              <button
                className="vote-btn upvote"
                onClick={() => handleQuestionVote('upvote')}
              >
                <FiThumbsUp className="icon" />
                {question.upvotes?.length || 0}
              </button>
              <button
                className="vote-btn downvote"
                onClick={() => handleQuestionVote('downvote')}
              >
                <FiThumbsDown className="icon" />
                {question.downvotes?.length || 0}
              </button>
            </div>

            <div className="question-meta">
              <div className="meta-item">
                <FiUser className="icon" />
                <span>{question.author?.name}</span>
              </div>
              <div className="meta-item">
                <FiClock className="icon" />
                <span>{format(new Date(question.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="meta-item">
                <FiMessageSquare className="icon" />
                <span>{answers.length} answers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="answers-section">
        <div className="answers-header">
          <h2>Answers ({answers.length})</h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowAnswerForm(true)}
          >
            <FiMessageSquare className="icon" />
            Add Answer
          </button>
        </div>

        <div className="answers-list">
          {answers.length === 0 ? (
            <div className="empty-state">
              <FiMessageSquare className="empty-icon" />
              <h3>No answers yet</h3>
              <p>Be the first to answer this question!</p>
            </div>
          ) : (
            answers.map(answer => (
              <AnswerCard
                key={answer._id}
                answer={answer}
                onVote={handleAnswerVote}
                onAccept={handleAcceptAnswer}
                isAccepted={answer.isAccepted}
              />
            ))
          )}
        </div>
      </div>

      {showAnswerForm && (
        <AnswerForm
          questionId={id}
          onClose={() => setShowAnswerForm(false)}
          onSuccess={() => {
            setShowAnswerForm(false);
            fetchQuestionData();
          }}
        />
      )}
    </div>
  );
};

const AnswerCard = ({ answer, onVote, onAccept, isAccepted }) => {
  return (
    <div className={`answer-card ${isAccepted ? 'accepted' : ''}`}>
      <div className="answer-content">
        <div className="answer-body">
          <p>{answer.text}</p>
          
          {answer.files && answer.files.length > 0 && (
            <div className="answer-files">
              <div className="files-list">
                {answer.files.map((file, index) => (
                  <a
                    key={index}
                    href={`http://localhost:5000/uploads/${file.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-link"
                  >
                    <FiPaperclip className="icon" />
                    {file.originalName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="answer-meta">
          <div className="answer-author">
            <FiUser className="icon" />
            <span>{answer.author?.name}</span>
          </div>
          <div className="answer-time">
            <FiClock className="icon" />
            <span>{format(new Date(answer.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      <div className="answer-actions">
        <div className="vote-buttons">
          <button
            className="vote-btn upvote"
            onClick={() => onVote(answer._id, 'upvote')}
          >
            <FiThumbsUp className="icon" />
            {answer.upvotes?.length || 0}
          </button>
          <button
            className="vote-btn downvote"
            onClick={() => onVote(answer._id, 'downvote')}
          >
            <FiThumbsDown className="icon" />
            {answer.downvotes?.length || 0}
          </button>
        </div>

        <button
          className={`accept-btn ${isAccepted ? 'accepted' : ''}`}
          onClick={() => onAccept(answer._id)}
        >
          <FiCheck className="icon" />
          {isAccepted ? 'Accepted' : 'Accept Answer'}
        </button>
      </div>
    </div>
  );
};

const AnswerForm = ({ questionId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    text: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`/answers/question/${questionId}`, {
        text: formData.text
      });

      toast.success('Answer posted successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add Answer</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="text">Your Answer</label>
            <textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={handleChange}
              placeholder="Write your answer here..."
              rows="6"
              required
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Posting...' : 'Post Answer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionPage;
