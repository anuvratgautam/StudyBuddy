import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Alert } from "react-bootstrap";
import { setStoredUserId, setStoredToken } from "../api/authClient";
import "./Login.css";

const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER || "http://localhost:9000";

export default function LoginGoogle() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function onSuccess(resp) {
    const idToken = resp?.credential;
    if (!idToken) {
      setError("Google returned no token");
      return;
    }
    
    try {
      const r = await fetch(`${AUTH_SERVER}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      const data = await r.json();
      
      if (!r.ok) throw new Error(JSON.stringify(data));
      
      setStoredUserId(data.userId);
      setStoredToken(data.token);
      navigate("/");
    } catch (err) {
      console.error("auth error", err);
      setError("Login failed. Please check your connection and try again.");
    }
  }

  function onError(err) {
    console.error("google error", err);
    setError("Google sign-in failed. Please try again.");
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="login-page">
        <Container>
          <Row className="justify-content-center align-items-center min-vh-100">
            <Col md={6} lg={5} xl={4}>
              <Card className="login-card shadow-lg">
                <Card.Body className="p-5">
                  <div className="text-center mb-4">
                    <div className="app-logo mb-3">
                      <i className="bi bi-book-half"></i>
                    </div>
                    <h2 className="app-title">StudyBuddy</h2>
                    <p className="app-subtitle text-muted">
                      Your AI-Powered Study Companion
                    </p>
                  </div>

                  {error && (
                    <Alert variant="danger" dismissible onClose={() => setError("")}>
                      {error}
                    </Alert>
                  )}

                  <div className="features-list mb-4">
                    <div className="feature-item">
                      <i className="bi bi-file-earmark-pdf"></i>
                      <span>Upload & Analyze PDFs</span>
                    </div>
                    <div className="feature-item">
                      <i className="bi bi-chat-dots"></i>
                      <span>Ask Questions</span>
                    </div>
                    <div className="feature-item">
                      <i className="bi bi-lightbulb"></i>
                      <span>Get Instant Answers</span>
                    </div>
                  </div>

                  <div className="google-login-wrapper">
                    <p className="login-instruction mb-3">Sign in to get started</p>
                    <div className="d-flex justify-content-center">
                      <GoogleLogin 
                        onSuccess={onSuccess} 
                        onError={onError}
                        theme="filled_blue"
                        size="large"
                        text="continue_with"
                        shape="rectangular"
                      />
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <small className="text-muted">
                      By signing in, you agree to our Terms of Service
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </GoogleOAuthProvider>
  );
}