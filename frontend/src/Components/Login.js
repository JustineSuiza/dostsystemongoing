import React, { useState } from 'react';
import logo from './Images/logo pcaarrd.png';
import { Container, Row, Col, Card, Toast } from 'react-bootstrap';
import './login-style.css';
import { Link, useNavigate } from 'react-router-dom';

const Login = ({ handleLogin }) => {
  const [showErrorToast, setShowErrorToast] = useState(false);
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState('');

  const login = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;

    try {
      const response = await handleLogin(email, password);
  
      if (response.success) {
        navigate('/DOST');
      } else {
        setShowErrorToast(true);
        setToastMessage(response.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      setShowErrorToast(true);
      setToastMessage('An error occurred while logging in.');
    }
  };

  return (
    <section className="vh-100">
      <div className="containerr py-5 h-100">
        <Row className="d-flex justify-content-center align-items-center h-100">
          <Col xl={10}>
            <Card className="bg-light shadow mb-5 bg-white rounded">
              <Row className="g-0">
                <Col md={6} lg={5} className="d-flex justify-content-center align-items-center" style={{ backgroundColor: '#0e2238', borderRadius: '5px 0 0 5px' }}>
                  <img className="img-fluid w-50" src={logo} alt="logo"/>
                </Col>
                <Col md={6} lg={7} className="d-flex align-items-center">
                  <Card.Body className="p-4 p-lg-5 text-black">
                    <br /><br />
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      login();
                    }}>
                      <h5 className="fw-normal mb-3 pb-3" style={{ letterSpacing: '1px' }}>Log into your account</h5>
                      <div className="form-outline mb-4">
                        <h6>Email</h6>
                        <input type="email" id="email" className="form-control form-control-lg" autoComplete="username" required />
                      </div>
                      <div className="form-outline mb-4">
                        <h6>Password</h6>
                        <input type="password" id="pass" className="form-control form-control-lg" autoComplete="current-password" required />
                      </div>
                      <div className="pt-1 mb-4">
                        <button className="btn btn-lg btn-block" style={{ backgroundColor: '#0e2238', color: '#ffffff' }} type="submit">Login</button>
                      </div>
                      <button
                        type="button"
                        className="btn btn-link small text-muted p-0"
                        onClick={() => navigate('/ForgotPassword')}
                      >
                        Forgot password?
                      </button>
                      <p className="mb-5 pb-lg-2" style={{ color: '#0e2238' }}> Don't have an account? <Link to="/Signup" style={{ color: '#0e2238' }}>Register here</Link></p>
                    </form>

                    <Toast show={showErrorToast} onClose={() => setShowErrorToast(false)} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                      <Toast.Header>
                        <strong className="me-auto">Error</strong>
                      </Toast.Header>
                      <Toast.Body>{toastMessage}</Toast.Body>
                    </Toast>
                  </Card.Body>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </section>
  );
}

export default Login;
