import EmojiPicker from 'emoji-picker-react'; // Import Emoji Picker
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000'); // Backend URL (Change when deployed)

const App = () => {
  const [username, setUsername] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState('');
  const [newMessageIndicator, setNewMessageIndicator] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Toggle emoji picker
  const [typingUser, setTypingUser] = useState(null);

  useEffect(() => {
    socket.on('updateUserList', (userList) => {
      setUsers(userList);
    });

    socket.on('receiveMessage', (data) => {
      const { sender, message } = data;

      setMessages((prev) => ({
        ...prev,
        [sender]: [...(prev[sender] || []), { sender, message }],
      }));

      if (selectedUser !== sender) {
        setNewMessageIndicator((prev) => ({
          ...prev,
          [sender]: true, // Set green dot indicator if the chat is not open
        }));
      }
    });

    // Listen for typing event
    socket.on('userTyping', (user) => {
      setTypingUser(user);
      setTimeout(() => setTypingUser(null), 1000); // Remove after 2 seconds
    });

    return () => {
      socket.off('updateUserList');
      socket.off('receiveMessage');
      socket.off('userTyping');
    };
  }, [selectedUser]);

  const registerUser = () => {
    if (username.trim() !== '') {
      socket.emit('register', username);
      setIsRegistered(true);
    }
  };

  const sendMessage = () => {
    if (message.trim() !== '' && selectedUser) {
      socket.emit('sendMessage', {
        sender: username,
        receiver: selectedUser,
        message,
      });

      setMessages((prev) => ({
        ...prev,
        [selectedUser]: [
          ...(prev[selectedUser] || []),
          { sender: username, message },
        ],
      }));

      setMessage('');
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setNewMessageIndicator((prev) => ({
      ...prev,
      [user]: false, // Remove green dot when chat is opened
    }));
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  // Emit "typing" event when user types
  const handleTyping = () => {
    if (selectedUser) {
      socket.emit('typing', { sender: username, receiver: selectedUser });
    }
  };

  return (
    <div>
      {!isRegistered ? (
        <div className="welcome-screen">
          <div>
            <h2>Enter Your Name and Start Chat</h2>
            <input
              type="text"
              placeholder="Enter name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="chat-input"
            />
            <button onClick={registerUser}>Join Chat</button>
          </div>
        </div>
      ) : (
        <div className="chat-container">
          {/* Sidebar - Online Users */}
          <div className="sidebar">
            <div className="sidebar-title">
              <h2>Welcome</h2>
              <h3>{username}</h3>
            </div>

            <h3>Online Users</h3>
            <ul className="user-list">
              {users
                .filter((user) => user !== username) // Don't show logged-in user in sidebar
                .map((user, index) => (
                  <li
                    key={index}
                    onClick={() => handleUserClick(user)}
                    className={`user ${
                      selectedUser === user ? 'active-user' : ''
                    }`}
                  >
                    {user}
                    {newMessageIndicator[user] && (
                      <span className="green-dot"></span>
                    )}
                  </li>
                ))}
            </ul>
          </div>

          {/* Chat Box - Separate Chat for Each User */}
          <div className="chat-box">
            {selectedUser ? (
              <>
                <div className="chat-header">{selectedUser}</div>
                {/* Typing Indicator */}

                <div className="chat-messages">
                  {(messages[selectedUser] || []).map((msg, index) => (
                    <div
                      key={index}
                      className={`message ${
                        msg.sender === username ? 'sent' : 'received'
                      }`}
                    >
                      <strong>{msg.sender}: </strong> {msg.message}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {typingUser === selectedUser && (
                    <div className="typing-indicator">
                      {selectedUser} is typing...
                    </div>
                  )}
                </div>

                {/* Chat Input Section with Emoji Picker */}
                <div className="chat-input">
                  {/* Emoji Picker Toggle Button */}

                  {/* Emoji Picker Dropdown */}
                  {showEmojiPicker && (
                    <div className="emoji-picker">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}

                  <input
                    className="message-input"
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                  />
                  <button
                    className="emoji-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    😊
                  </button>
                  <button className="message-btn" onClick={sendMessage}>
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="welcome-screen">
                <p>Select a user to chat</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
