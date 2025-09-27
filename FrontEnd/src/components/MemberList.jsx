import { useState, useEffect } from 'react';
import { FiUsers, FiUser, FiAward, FiBookOpen, FiX } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import './MemberList.css';

const MemberListModal = ({ classId, onClose }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCount: 0, teacherCount: 0, studentCount: 0 });

  useEffect(() => {
    fetchMembers();
  }, [classId]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`/classes/${classId}/members`);
      setMembers(response.data.members);
      setStats({
        totalCount: response.data.totalCount,
        teacherCount: response.data.teacherCount,
        studentCount: response.data.studentCount
      });
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load member list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content member-modal">
        <div className="modal-header">
          <h2><FiUsers className="icon" /> Class Members</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <div className="member-stats">
          <span className="stat">
            <FiAward className="icon" />
            {stats.teacherCount} teachers
          </span>
          <span className="stat">
            <FiBookOpen className="icon" />
            {stats.studentCount} students
          </span>
          <span className="stat total">
            {stats.totalCount} total
          </span>
        </div>

        <div className="members-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="empty-state">
              <FiUsers className="empty-icon" />
              <p>No members found</p>
            </div>
          ) : (
            <div className="members-list-simple">
              {members.map((member, index) => (
                <div key={member._id || index} className="member-item">
                  <div className="member-avatar-simple">
                    {member.role === 'teacher' ? (
                      <FiAward className="avatar-icon" />
                    ) : (
                      <FiUser className="avatar-icon" />
                    )}
                  </div>
                  <span className="member-name-simple">
                    {member.user?.name || 'Unknown User'}
                    {member.role === 'teacher' && <span className="role-badge">Teacher</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberListModal;
