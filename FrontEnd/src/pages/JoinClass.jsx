import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiKey } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import './JoinClass.css';

const JoinClass = () => {
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (classCode.length !== 6) {
      toast.error('Class code must be exactly 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/classes/join', { classCode });
      toast.success('Successfully joined the class!');
      navigate(`/class/${response.data.class._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-class">
      <div className="join-class-container">
        <div className="join-class-header">
          <h1>Join a Class</h1>
          <p>Enter the class code provided by your teacher to join</p>
        </div>

        <form onSubmit={handleSubmit} className="join-class-form">
          <div className="form-group">
            <label htmlFor="classCode">Class Code</label>
            <div className="input-group">
              <FiKey className="input-icon" />
              <input
                type="text"
                id="classCode"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character class code"
                maxLength="6"
                required
              />
            </div>
            <small className="form-help">
              The class code should be 6 characters long (letters and numbers)
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || classCode.length !== 6}
          >
            {loading ? 'Joining...' : 'Join Class'}
          </button>
        </form>

        <div className="join-class-info">
          <div className="info-card">
            <FiUsers className="info-icon" />
            <h3>Need a class code?</h3>
            <p>Ask your teacher for the 6-character class code. It should look something like:</p>
            <div className="code-example">
              <span className="example-code">ABC123</span>
            </div>
            <p>Once you join, you'll be able to:</p>
            <ul>
              <li>View and ask questions in the class</li>
              <li>Answer questions from other students</li>
              <li>Vote on questions and answers</li>
              <li>Upload files with your questions and answers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinClass;
