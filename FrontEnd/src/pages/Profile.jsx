import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiEdit3, FiSave, FiX } from 'react-icons/fi';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    questionsAsked: 0,
    answersGiven: 0,
    classesJoined: 0,
    classesCreated: 0
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const [questionsResponse, answersResponse, classesResponse] = await Promise.all([
        axios.get('/questions/user/stats'),
        axios.get('/answers/user/stats'),
        axios.get('/classes')
      ]);

      setStats({
        questionsAsked: questionsResponse.data.count || 0,
        answersGiven: answersResponse.data.count || 0,
        classesJoined: classesResponse.data.joinedClasses?.length || 0,
        classesCreated: classesResponse.data.createdClasses?.length || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setLoading(true);

    const result = await updateProfile(formData.name, formData.email);
    
    if (result.success) {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } else {
      toast.error(result.message);
    }
    
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <FiUser className="avatar-icon" />
          </div>
          <div className="profile-info">
            <h1>{user.name}</h1>
            <p className="profile-email">{user.email}</p>
            <span className={`profile-role ${user.role}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <FiX className="icon" /> : <FiEdit3 className="icon" />}
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h2>Profile Information</h2>
            {isEditing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <FiSave className="icon" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-details">
                <div className="detail-item">
                  <strong>Name:</strong> {user.name}
                </div>
                <div className="detail-item">
                  <strong>Email:</strong> {user.email}
                </div>
                <div className="detail-item">
                  <strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
                <div className="detail-item">
                  <strong>Member since:</strong> {format(new Date(user.createdAt), 'MMMM d, yyyy')}
                </div>
              </div>
            )}
          </div>

          <div className="profile-section">
            <h2>Activity Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.questionsAsked}</div>
                <div className="stat-label">Questions Asked</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.answersGiven}</div>
                <div className="stat-label">Answers Given</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.classesJoined}</div>
                <div className="stat-label">Classes Joined</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.classesCreated}</div>
                <div className="stat-label">Classes Created</div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Your Classes</h2>
            <div className="classes-list">
              {user.joinedClasses && user.joinedClasses.length > 0 ? (
                user.joinedClasses.map(classItem => (
                  <div key={classItem._id} className="class-item">
                    <div className="class-info">
                      <h3>{classItem.name}</h3>
                      <p>{classItem.description}</p>
                      <span className="class-code">Code: {classItem.classCode}</span>
                    </div>
                    <div className="class-role">
                      <span className="role-badge">Member</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message">You haven't joined any classes yet.</p>
              )}
            </div>
          </div>

          {user.createdClasses && user.createdClasses.length > 0 && (
            <div className="profile-section">
              <h2>Classes You Created</h2>
              <div className="classes-list">
                {user.createdClasses.map(classItem => (
                  <div key={classItem._id} className="class-item">
                    <div className="class-info">
                      <h3>{classItem.name}</h3>
                      <p>{classItem.description}</p>
                      <span className="class-code">Code: {classItem.classCode}</span>
                    </div>
                    <div className="class-role">
                      <span className="role-badge creator">Creator</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
