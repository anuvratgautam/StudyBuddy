import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar, Container, Nav, Dropdown } from "react-bootstrap";
import { getStoredUserId, clearAuth } from "../api/authClient";
import "./NavBar.css";

export default function NavBar() {
  const navigate = useNavigate();
  const userId = getStoredUserId();

  function logout() {
    clearAuth();
    navigate("/login");
  }

  // Get initials from email
  const getInitials = (email) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  return (
    <Navbar className="custom-navbar shadow-sm" expand="lg">
      <Container fluid className="d-flex justify-content-between align-items-center">
        {/* Left Side - Brand */}
        <Navbar.Brand as={Link} to="/" className="brand-name">
          <i className="bi bi-book-half me-2"></i>
          StudyBuddy
        </Navbar.Brand>
        
        {/* Right Side - Toggle and Controls */}
        <div className="d-flex align-items-center gap-2">
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav className="ms-auto">
              {!userId ? (
                <Nav.Link as={Link} to="/login" className="login-link">
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Login
                </Nav.Link>
              ) : (
                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" className="user-dropdown" id="dropdown-user">
                    <div className="user-avatar">
                      {getInitials(userId)}
                    </div>
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="user-dropdown-menu">
                    <Dropdown.Item onClick={logout} className="logout-item">
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </div>
      </Container>
    </Navbar>
  );
}