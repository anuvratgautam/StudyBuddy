import React, { useEffect, useState, useRef } from "react";
import { Container, Row, Col, Card, Form, Button, ListGroup, Alert, Badge } from "react-bootstrap";
import { askQuestion, uploadPdf, getDocuments, deleteDocument, clearDocuments } from "../api/helperClient";
import { getStoredUserId, clearAuth } from "../api/authClient";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const chatBoxRef = useRef(null);
  
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { 
    fetchDocs();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchDocs() {
    setError("");
    setLoadingDocs(true);
    try {
      const data = await getDocuments();
      setDocs(data.documents || []);
    } catch (err) {
      console.error("getDocuments", err);
      setError(`Failed to load documents${err.status ? ` (status ${err.status})` : ''}`);
      if (err.status === 401) { 
        clearAuth(); 
        navigate("/login"); 
      }
    } finally { 
      setLoadingDocs(false); 
    }
  }

  async function handleSend(e) {
    e?.preventDefault();
    if (!question.trim()) return;
    
    const userQuestion = question;
    setMessages(m => [...m, { sender: "You", text: userQuestion }]);
    setQuestion("");
    setLoadingChat(true);
    
    try {
      const res = await askQuestion(userQuestion);
      setMessages(m => [...m, { sender: "AI", text: res.answer }]);
    } catch (err) {
      console.error("ask", err);
      setError("Failed to get AI response. Please try again.");
      setMessages(m => [...m, { sender: "AI", text: "Sorry, I couldn't process your question. Please try again." }]);
    } finally {
      setLoadingChat(false);
    }
  }

  async function handleUpload() {
    if (!file) return setError("Please choose a PDF file");
    
    setError("");
    try {
      const res = await uploadPdf(file);
      setError("");
      setFile(null);
      // Clear file input
      document.getElementById("pdf-upload").value = "";
      await fetchDocs();
    } catch (err) {
      console.error("upload", err);
      setError("Upload failed: " + (err.body || err.message));
    }
  }

  async function handleDelete(name) {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { 
      await deleteDocument(name); 
      await fetchDocs(); 
    } catch (err) { 
      setError("Delete failed"); 
    }
  }

  async function handleClear() {
    if (!window.confirm("Clear all documents? This action cannot be undone.")) return;
    try { 
      await clearDocuments(); 
      await fetchDocs(); 
    } catch (err) { 
      setError("Clear failed"); 
    }
  }

  return (
    <div className="dashboard-page">
      <Container fluid className="py-4">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")} className="mb-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </Alert>
        )}

        <Row className="g-4">
          {/* Chat Section */}
          <Col lg={8}>
            <Card className="dashboard-card chat-card h-100">
              <Card.Header className="dashboard-card-header">
                <div className="d-flex align-items-center">
                  <i className="bi bi-chat-dots-fill me-2"></i>
                  <h5 className="mb-0">Chat with AI</h5>
                </div>
                <Badge bg="success" pill>{messages.length} messages</Badge>
              </Card.Header>
              
              <Card.Body className="d-flex flex-column p-0">
                <div className="chat-box" ref={chatBoxRef}>
                  {messages.length === 0 ? (
                    <div className="empty-state">
                      <i className="bi bi-chat-square-text"></i>
                      <h4>Hello! What will you learn today?</h4>
                      <p>Upload your documents and start asking questions</p>
                    </div>
                  ) : (
                    <div className="messages-container">
                      {messages.map((m, i) => (
                        <div key={i} className={`message-wrapper ${m.sender === "You" ? "user-message" : "ai-message"}`}>
                          <div className="message-bubble">
                            <div className="message-sender">{m.sender}</div>
                            <div className="message-text">{m.text}</div>
                          </div>
                        </div>
                      ))}
                      {loadingChat && (
                        <div className="message-wrapper ai-message">
                          <div className="message-bubble">
                            <div className="typing-indicator">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="chat-input-section">
                  <Form onSubmit={handleSend}>
                    <div className="input-group-custom">
                      <Form.Control
                        type="text"
                        placeholder="Ask something about your documents..."
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        disabled={loadingChat}
                        className="chat-input"
                      />
                      <Button 
                        type="submit" 
                        className="send-button"
                        disabled={loadingChat || !question.trim()}
                      >
                        {loadingChat ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <i className="bi bi-send-fill"></i>
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Documents Section */}
          <Col lg={4}>
            <Card className="dashboard-card docs-card h-100">
              <Card.Header className="dashboard-card-header">
                <div className="d-flex align-items-center">
                  <i className="bi bi-folder-fill me-2"></i>
                  <h5 className="mb-0">My Documents</h5>
                </div>
                <Badge bg="primary" pill>{docs.length} files</Badge>
              </Card.Header>
              
              <Card.Body>
                {/* Upload Section */}
                <div className="upload-section mb-4">
                  <Form.Group>
                    <div className="file-input-wrapper mb-2">
                      <Form.Control
                        type="file"
                        id="pdf-upload"
                        accept="application/pdf"
                        onChange={e => setFile(e.target.files[0] || null)}
                        className="d-none"
                      />
                      <label htmlFor="pdf-upload" className="file-label">
                        <i className="bi bi-cloud-upload me-2"></i>
                        Choose PDF File
                      </label>
                    </div>
                    
                    {file && (
                      <div className="selected-file mb-2">
                        <i className="bi bi-file-earmark-pdf me-2"></i>
                        <span>{file.name}</span>
                      </div>
                    )}
                    
                    <Button 
                      variant="primary" 
                      className="w-100 upload-button"
                      onClick={handleUpload}
                      disabled={!file}
                    >
                      <i className="bi bi-upload me-2"></i>
                      Upload Document
                    </Button>
                  </Form.Group>
                </div>

                {/* Documents List */}
                <div className="documents-list-section">
                  {loadingDocs ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted">Loading documents...</p>
                    </div>
                  ) : docs.length === 0 ? (
                    <div className="empty-docs text-center py-4">
                      <i className="bi bi-inbox"></i>
                      <p>No documents uploaded yet</p>
                      <small className="text-muted">Upload a PDF to get started</small>
                    </div>
                  ) : (
                    <>
                      <ListGroup variant="flush" className="documents-list">
                        {docs.map(d => (
                          <ListGroup.Item key={d} className="document-item">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-file-earmark-pdf-fill text-danger me-2"></i>
                              <span className="document-name flex-grow-1">{d}</span>
                              <Button
                                variant="link"
                                size="sm"
                                className="delete-doc-btn"
                                onClick={() => handleDelete(d)}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                      
                      {docs.length > 0 && (
                        <div className="mt-3">
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="w-100"
                            onClick={handleClear}
                          >
                            <i className="bi bi-trash3 me-2"></i>
                            Clear All Documents
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}