import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Groups.css';
import { FaPencilAlt, FaPaperclip, FaDownload, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import TaskBoard from '../components/TaskBoard';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    subject: '',
    max_members: 5
  });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagePollingInterval, setMessagePollingInterval] = useState(null);
  const [editGroupData, setEditGroupData] = useState({
    name: '',
    description: '',
    subject: '',
    max_members: 5
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFormVisible, setIsSearchFormVisible] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/study-groups/`, {
        headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
      });
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to load study groups. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (groupId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/study-groups/${groupId}/messages/`, {
        headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    let interval;
    if (showChatModal && selectedGroup) {
      fetchMessages(selectedGroup.id);
      interval = setInterval(() => {
        fetchMessages(selectedGroup.id);
      }, 3000);
      setMessagePollingInterval(interval);
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        setMessagePollingInterval(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showChatModal, selectedGroup, fetchMessages]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/study-groups/`, newGroup, {
        headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
      });
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', subject: '', max_members: 5 });
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/study-groups/${groupId}/join/`, {}, {
        headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
      });
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group. Please try again.');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/study-groups/${groupId}/leave/`, {}, {
        headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
      });
      fetchGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to leave group. Please try again.');
      }
    }
  };

  const handleDismissGroup = async (groupId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/study-groups/${groupId}/dismiss/`, {}, {
        headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
      });
      fetchGroups();
    } catch (error) {
      console.error('Error dismissing group:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to dismiss group. Please try again.');
      }
    }
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setShowMembersModal(true);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/study-groups/${selectedGroup.id}/create_message/`, {
        content: newMessage.trim()
      }, {
        headers: {
          'Authorization': `Token ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNewMessage('');
      fetchMessages(selectedGroup.id);
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to send message. Please try again.');
      }
    }
  };

  const handleCloseChatModal = () => {
    setShowChatModal(false);
    setMessages([]);
    setIsSearchFormVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
      setMessagePollingInterval(null);
    }
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/study-groups/${selectedGroup.id}/`,
        editGroupData,
        {
          headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
        }
      );
      setShowEditModal(false);
      setSelectedGroup({ ...selectedGroup, ...editGroupData });
      fetchGroups(); // Refresh the groups list
    } catch (error) {
      console.error('Error updating group:', error);
      if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to update group. Please try again.');
      }
    }
  };

  const openEditModal = (group) => {
    setEditGroupData({
      name: group.name,
      description: group.description,
      subject: group.subject,
      max_members: group.max_members
    });
    setShowEditModal(true);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedGroup) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      console.log('Starting file upload process for file:', selectedFile.name);
      console.log('Selected group ID:', selectedGroup.id);
      
      // First create a message with the file name using the create_message action
      const messageResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/study-groups/${selectedGroup.id}/create_message/`,
        { content: `Uploaded file: ${selectedFile.name}` },
        {
          headers: {
            'Authorization': `Token ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Message created:', messageResponse.data); // Debug log

      // Then attach the file to the created message
      const messageId = messageResponse.data.id;
      if (!messageId) {
        throw new Error('No message ID received from server');
      }
      
      console.log('Message ID for file upload:', messageId);
      console.log('File to upload:', selectedFile);

      // Upload the file using the correct URL structure
      const uploadUrl = `${process.env.REACT_APP_API_URL}/api/study-groups/messages/${messageId}/upload_file/`;
      console.log('Upload URL:', uploadUrl);
      
      const uploadResponse = await axios.post(
        uploadUrl,
        formData,
        {
          headers: {
            'Authorization': `Token ${sessionStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('File uploaded:', uploadResponse.data); // Debug log
      
      // Reset the file input value to allow selecting the same file again
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
      
      setSelectedFile(null);
      fetchMessages(selectedGroup.id);
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        toast.error(error.response.data.detail || 'Failed to upload file. Please try again.');
      } else {
        toast.error('Failed to upload file. Please try again.');
      }
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileDownload = async (fileId) => {
    try {
      console.log('Downloading file with ID:', fileId);
      
      // First, get the file details to get the original filename
      const fileDetailsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/study-groups/messages/download_file/?file_id=${fileId}`,
        {
          headers: { Authorization: `Token ${sessionStorage.getItem('token')}` },
          responseType: 'blob'
        }
      );
      
      console.log('Download response headers:', fileDetailsResponse.headers);
      
      // Extract filename from Content-Disposition header
      let filename = 'downloaded-file';
      const contentDisposition = fileDetailsResponse.headers['content-disposition'];
      console.log('Content-Disposition header:', contentDisposition);
      
      if (contentDisposition) {
        // Try different patterns to extract the filename
        let filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (!filenameMatch) {
          filenameMatch = contentDisposition.match(/filename=([^;]+)/);
        }
        
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1].replace(/"/g, ''));
          console.log('Extracted filename from Content-Disposition:', filename);
        } else {
          console.log('Could not extract filename from Content-Disposition');
        }
      } else {
        console.log('No Content-Disposition header found');
        
        // If Content-Disposition header is missing, try to get the filename from the URL
        // or use a default name based on the file ID
        filename = `file-${fileId}`;
        console.log('Using default filename:', filename);
      }
      
      // Create a blob with the correct type
      const contentType = fileDetailsResponse.headers['content-type'] || 'application/octet-stream';
      console.log('Content-Type:', contentType);
      
      const blob = new Blob([fileDetailsResponse.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      }
      alert('Failed to download file. Please try again.');
    }
  };

  const handleFileDelete = async (messageId, fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/study-groups/messages/${messageId}/delete_file/?file_id=${fileId}`,
        {
          headers: { Authorization: `Token ${sessionStorage.getItem('token')}` }
        }
      );
      
      fetchMessages(selectedGroup.id);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      console.log('Searching messages in group:', selectedGroup.id);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/study-groups/${selectedGroup.id}/search_messages/?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: { 
            Authorization: `Token ${sessionStorage.getItem('token')}` 
          }
        }
      );
      console.log('Search response:', response.data);
      setSearchResults(response.data);
      if (response.data.length === 0) {
        toast.info('No messages found matching your search.');
      }
    } catch (error) {
      console.error('Error searching messages:', error);
      toast.error(error.response?.data?.detail || 'Failed to search messages. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setIsSearchFormVisible(false);
  };

  const toggleSearch = () => {
    setIsSearchFormVisible(!isSearchFormVisible);
    if (!isSearchFormVisible) {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const highlightSearchText = (text, searchQuery) => {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  };

  if (loading) {
    return (
      <div className="groups-container">
        <div className="loading-message">Loading study groups...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="groups-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchGroups} className="retry-button">Try Again</button>
      </div>
    );
  }

  return (
    <div className="groups-container">
      <div className="groups-header">
        <h1>Study Groups</h1>
        <button 
          className="create-group-btn"
          onClick={() => setShowCreateModal(true)}
        >
          Create New Group
        </button>
      </div>

      <div className="groups-grid">
        {groups && groups.length > 0 ? (
          groups.map(group => (
            <div key={group.id} className="group-card" onClick={() => handleGroupClick(group)}>
              <h3>{group.name}</h3>
              <p className="group-subject">Subject: {group.subject}</p>
              <p className="group-description">{group.description}</p>
              <div className="group-footer">
                <span>{group.members_count}/{group.max_members} members</span>
                {!group.is_member && group.members_count < group.max_members && (
                  <button 
                    className="join-group-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinGroup(group.id);
                    }}
                  >
                    Join Group
                  </button>
                )}
                {group.is_member && (
                  <>
                    <span className={group.is_creator ? "owner-badge" : "member-badge"}>
                      {group.is_creator ? "Owner" : "Member"}
                    </span>
                    {group.is_creator ? (
                      <button 
                        className="dismiss-group-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissGroup(group.id);
                        }}
                      >
                        Dismiss Group
                      </button>
                    ) : (
                      <button 
                        className="leave-group-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveGroup(group.id);
                        }}
                      >
                        Leave Group
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-groups-message">
            No study groups available. Create one to get started!
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create New Study Group</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={newGroup.subject}
                  onChange={(e) => setNewGroup({...newGroup, subject: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Maximum Members</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={newGroup.max_members}
                  onChange={(e) => setNewGroup({...newGroup, max_members: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="create-btn">Create Group</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMembersModal && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="group-title-container">
                <h2>{selectedGroup.name}</h2>
                {selectedGroup.is_creator && (
                  <button 
                    className="edit-group-btn"
                    onClick={() => openEditModal(selectedGroup)}
                  >
                    <FaPencilAlt />
                    <span>Edit Group</span>
                  </button>
                )}
              </div>
              <h3>Members</h3>
            </div>
            <div className="members-list">
              <table>
                <colgroup>
                  <col className="col-name" />
                  <col className="col-email" />
                  <col className="col-role" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="col-name">Name</th>
                    <th className="col-email">Email</th>
                    <th className="col-role">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup.members.map(member => (
                    <tr key={member.id}>
                      <td className="col-name">{`${member.first_name} ${member.last_name}`}</td>
                      <td className="col-email">{member.email}</td>
                      <td className="col-role">
                        <span className={selectedGroup.creator === member.id ? "owner-badge" : "member-badge"}>
                          {selectedGroup.creator === member.id ? "Owner" : "Member"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-buttons">
              {selectedGroup && selectedGroup.is_member && (
                <button 
                  className="chat-btn"
                  onClick={() => {
                    setShowMembersModal(false);
                    setShowChatModal(true);
                  }}
                >
                  Enter Chat Room
                </button>
              )}
              {selectedGroup && selectedGroup.is_member && (
                <button 
                  className="tasks-btn"
                  onClick={() => {
                    setShowMembersModal(false);
                    setShowTasksModal(true);
                  }}
                >
                  Show Tasks
                </button>
              )}
              <button 
                className="cancel-btn"
                onClick={() => setShowMembersModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showChatModal && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal chat-modal">
            <div className="chat-header">
              <h2>{selectedGroup.name}</h2>
              <button className="search-toggle" onClick={toggleSearch}>
                <FaSearch />
              </button>
            </div>
            
            <div className="chat-search">
              <form 
                className={`search-form ${isSearchFormVisible ? 'visible' : ''}`}
                onSubmit={handleSearch}
              >
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="search-button"
                  disabled={!searchQuery.trim() || isSearching}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
                <button 
                  type="button" 
                  className="clear-search-button"
                  onClick={clearSearch}
                >
                  Clear
                </button>
              </form>
            </div>

            <div className="messages">
              {searchResults.length > 0 ? (
                <div className="search-results-container">
                  <div className="search-results-header">
                    <span className="search-results-title">Search Results</span>
                    <span className="search-results-count">{searchResults.length} message(s) found</span>
                  </div>
                  {searchResults.map((message) => (
                    <div key={message.id} className="search-result-item">
                      <div className="message-header">
                        <span className="message-sender">
                          {message.sender.first_name} {message.sender.last_name}
                        </span>
                        <span className="message-time">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div 
                        className="message-content"
                        dangerouslySetInnerHTML={{
                          __html: highlightSearchText(message.content, searchQuery)
                        }}
                      />
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="message-attachments">
                          {message.attachments.map(attachment => (
                            <div key={attachment.id} className="attachment-item">
                              <span className="attachment-name">{attachment.original_filename}</span>
                              <div className="attachment-actions">
                                <button
                                  onClick={() => handleFileDownload(attachment.id)}
                                  className="attachment-btn"
                                  title="Download"
                                >
                                  <FaDownload />
                                </button>
                                {(message.sender.id === user.id || attachment.uploaded_by.id === user.id) && (
                                  <button
                                    onClick={() => handleFileDelete(message.id, attachment.id)}
                                    className="attachment-btn delete"
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : searchQuery && !isSearching ? (
                <div className="no-results-message">
                  No messages found matching your search.
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`message ${message.sender.id === user.id ? 'message-own' : 'message-other'}`}
                  >
                    <div className="message-header">
                      <span className="message-sender">
                        {message.sender.first_name} {message.sender.last_name}
                      </span>
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-content">{message.content}</div>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="message-attachments">
                        {message.attachments.map(attachment => (
                          <div key={attachment.id} className="attachment-item">
                            <span className="attachment-name">{attachment.original_filename}</span>
                            <div className="attachment-actions">
                              <button
                                onClick={() => handleFileDownload(attachment.id)}
                                className="attachment-btn"
                                title="Download"
                              >
                                <FaDownload />
                              </button>
                              {(message.sender.id === user.id || attachment.uploaded_by.id === user.id) && (
                                <button
                                  onClick={() => handleFileDelete(message.id, attachment.id)}
                                  className="attachment-btn delete"
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendMessage} className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="chat-input-field"
              />
              <div className="chat-actions">
                <label className="file-upload-btn">
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    style={{ display: 'none' }}
                    key={selectedFile ? 'file-selected' : 'no-file'}
                  />
                  <FaPaperclip />
                </label>
                {selectedFile && (
                  <div className="file-upload-form">
                    <span className="selected-file-name">{selectedFile.name}</span>
                    <div className="file-upload-buttons">
                      <button 
                        type="button" 
                        className="upload-btn"
                        onClick={handleFileUpload}
                        disabled={uploadingFile}
                      >
                        {uploadingFile ? 'Uploading...' : 'Upload'}
                      </button>
                      <button 
                        type="button" 
                        className="clear-btn"
                        onClick={() => setSelectedFile(null)}
                        disabled={uploadingFile}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                <button type="submit" className="chat-send-btn">
                  Send
                </button>
              </div>
            </form>

            <div className="modal-buttons">
              <button className="cancel-btn" onClick={handleCloseChatModal}>
                Close Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {showTasksModal && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowTasksModal(false)}>
          <div className="modal task-modal" onClick={e => e.stopPropagation()}>
            <h2>{selectedGroup.name} - Tasks</h2>
            <div className="task-board-container">
              <TaskBoard groupId={selectedGroup.id} />
            </div>
            <div className="modal-buttons">
              <button 
                className="cancel-btn"
                onClick={() => setShowTasksModal(false)}
              >
                Close Tasks
              </button>
            </div>
          </div>
        </div>
      )}


      {showEditModal && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Group</h2>
            <form onSubmit={handleEditGroup}>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  value={editGroupData.name}
                  onChange={(e) => setEditGroupData({...editGroupData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={editGroupData.subject}
                  onChange={(e) => setEditGroupData({...editGroupData, subject: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editGroupData.description}
                  onChange={(e) => setEditGroupData({...editGroupData, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Maximum Members</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={editGroupData.max_members}
                  onChange={(e) => setEditGroupData({...editGroupData, max_members: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" className="save-btn">Save Changes</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups; 