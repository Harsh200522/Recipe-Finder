import React, { useState } from 'react';
import '../style/faqmodal.css';

export default function FAQModal({ isOpen, onClose, faqs }) {
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="faq-modal-overlay">
      <div className="faq-modal-content">
        <div className="faq-modal-header">
          <h2>All FAQs</h2>
          <button className="faq-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="faq-modal-search">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="faq-search-input"
          />
        </div>

        <div className="faq-modal-list">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map(faq => (
              <div key={faq.id} className="faq-item">
                <button
                  className={`faq-question ${expandedId === faq.id ? 'active' : ''}`}
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                >
                  <span className="faq-question-text">{faq.question}</span>
                  <span className="faq-toggle-icon">
                    {expandedId === faq.id ? '−' : '+'}
                  </span>
                </button>
                {expandedId === faq.id && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="faq-no-results">
              No FAQs match your search. Try different keywords!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
