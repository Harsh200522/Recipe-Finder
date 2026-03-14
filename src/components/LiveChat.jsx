import React, { useState, useRef, useEffect } from 'react';
import '../style/livechat.css';

export default function LiveChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 👋 Welcome to Recipe Finder support. What can I help you with today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const commonQuestions = [
    "How to search recipes?",
    "How to save favorites?",
    "How does meal planner work?",
    "How to use serving calculator?",
    "What is AI Cook feature?",
    "How to add to shopping list?",
    "How to watch cooking videos?",
    "How to reset password?",
    "How to sign up?",
    "My recipe not loading",
    "Video not playing",
    "Login problem",
    "Dark mode toggle",
    "Community recipes",
    "Report a bug",
    "Others"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!selectedQuestion.trim()) return;

    if (selectedQuestion === 'Others') {
      const userMessage = {
        id: messages.length + 1,
        text: selectedQuestion,
        sender: 'user',
        timestamp: new Date()
      };
      const botMessage = {
        id: messages.length + 2,
        text: "Please send your whole message using the form on the Contact Us page.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage, botMessage]);
      setSelectedQuestion('');
      return;
    }

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: selectedQuestion,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setSelectedQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: selectedQuestion,
          context: 'recipe-finder-support'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add bot response
      const botMessage = {
        id: messages.length + 2,
        text: data.reply || "I didn't understand that. Please try another question.",
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        id: messages.length + 2,
        text: "Sorry, I'm having trouble. Please try again or use the contact form.",
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="livechat-overlay" onClick={onClose}>
      <div className="livechat-container" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>
        
        <div className="livechat-header">
          <h3>💬 Recipe Finder Support</h3>
        </div>

        <div className="livechat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              <div className="message-content">
                <p>{msg.text}</p>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot loading">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="livechat-form">
          <select
            value={selectedQuestion}
            onChange={e => setSelectedQuestion(e.target.value)}
            disabled={isLoading}
            className="chat-select"
          >
            <option value="">Select a question...</option>
            {commonQuestions.map((question, index) => (
              <option key={index} value={question}>
                {question}
              </option>
            ))}
          </select>
          <button 
            onClick={sendMessage}
            disabled={isLoading || !selectedQuestion.trim()}
            className="send-button"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
