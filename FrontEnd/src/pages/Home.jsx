import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiPlus, FiUsers, FiMessageSquare, FiClock, FiEye } from 'react-icons/fi';
import { format } from 'date-fns';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState({ joinedClasses: [], createdClasses: [] });
  const [loading, setLoading] = useState(true);
  const [recentQuestions, setRecentQuestions] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [classesResponse, questionsResponse] = await Promise.all([
        axios.get('/classes'),
        axios.get('/questions/recent')
      ]);
      
      setClasses(classesResponse.data);
      setRecentQuestions(questionsResponse.data.questions || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your classes...</p>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="home-header">
        <h1>Welcome back, {user.name}!</h1>
        <p>Manage your classes and stay updated with the latest questions.</p>
      </div>

      <div className="home-content">
        {/* Quick Actions */}
        <div className="quick-actions">
          <Link to="/create-class" className="action-card create">
            <FiPlus className="action-icon" />
            <h3>Create Class</h3>
            <p>Start a new class and invite students</p>
          </Link>
          
          <Link to="/join-class" className="action-card join">
            <FiUsers className="action-icon" />
            <h3>Join Class</h3>
            <p>Enter a class code to join</p>
          </Link>
        </div>

        {/* Classes Grid */}
        <div className="classes-section">
          <h2>Your Classes</h2>
          
          {classes.createdClasses.length > 0 && (
            <div className="class-group">
              <h3>Classes You Created</h3>
              <div className="classes-grid">
                {classes.createdClasses.map(classItem => (
                  <ClassCard key={classItem._id} classItem={classItem} isCreator={true} />
                ))}
              </div>
            </div>
          )}

          {classes.joinedClasses.length > 0 && (
            <div className="class-group">
              <h3>Classes You Joined</h3>
              <div className="classes-grid">
                {classes.joinedClasses.map(classItem => (
                  <ClassCard key={classItem._id} classItem={classItem} isCreator={false} />
                ))}
              </div>
            </div>
          )}

          {classes.createdClasses.length === 0 && classes.joinedClasses.length === 0 && (
            <div className="empty-state">
              <FiUsers className="empty-icon" />
              <h3>No classes yet</h3>
              <p>Create your first class or join an existing one to get started!</p>
              <div className="empty-actions">
                <Link to="/create-class" className="btn btn-primary">Create Class</Link>
                <Link to="/join-class" className="btn btn-secondary">Join Class</Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent Questions */}
        {recentQuestions.length > 0 && (
          <div className="recent-questions">
            <h2>Recent Questions</h2>
            <div className="questions-list">
              {recentQuestions.map(question => (
                <div key={question._id} className="question-item">
                  <Link to={`/question/${question._id}`} className="question-link">
                    <h4>{question.title}</h4>
                    <p>{question.description.substring(0, 100)}...</p>
                    <div className="question-meta">
                      <span className="author">by {question.author.name}</span>
                      <span className="time">
                        <FiClock className="icon" />
                        {format(new Date(question.createdAt), 'MMM d, yyyy')}
                      </span>
                      <span className="views">
                        <FiEye className="icon" />
                        {question.views} views
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ClassCard = ({ classItem, isCreator }) => {
  return (
    <Link to={`/class/${classItem._id}`} className="class-card">
      <div className="class-header">
        <h3>{classItem.name}</h3>
        <span className={`class-badge ${isCreator ? 'creator' : 'member'}`}>
          {isCreator ? 'Creator' : 'Member'}
        </span>
      </div>
      
      {classItem.description && (
        <p className="class-description">{classItem.description}</p>
      )}
      
      <div className="class-meta">
        <div className="class-code">
          <strong>Code:</strong> {classItem.classCode}
        </div>
        <div className="class-members">
          <FiUsers className="icon" />
          {classItem.members?.length || 0} members
        </div>
      </div>
    </Link>
  );
};

export default Home;
