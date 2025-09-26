import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiPlus } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import './CreateClass.css';

const CreateClass = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const response = await axios.post('/classes/create', formData);
      toast.success('Class created successfully!');
      navigate(`/class/${response.data.class._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-class">
      <div className="create-class-container">
        <div className="create-class-header">
          <h1>Create New Class</h1>
          <p>Set up a new class and invite students to join</p>
        </div>

        <form onSubmit={handleSubmit} className="create-class-form">
          <div className="form-group">
            <label htmlFor="name">Class Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter class name (e.g., Math 101, Computer Science)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this class is about..."
              rows="4"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>

        <div className="create-class-info">
          <div className="info-card">
            <FiUsers className="info-icon" />
            <h3>How it works</h3>
            <ul>
              <li>We'll generate a unique 6-character code for your class</li>
              <li>Share this code with your students to let them join</li>
              <li>Students can ask questions and get answers from you and peers</li>
              <li>You can manage class settings and moderate content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClass;
