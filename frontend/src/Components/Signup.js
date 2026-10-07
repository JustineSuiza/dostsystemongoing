import React, { useState } from 'react';
import logo from './Images/logo pcaarrd.png'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import './login-style.css';
import { Row, Col, Card, Toast } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';

const Signup = () => {
    // const [username, setUsername] = useState('');
    const [first_name, setFirstname] = useState('');
    const [last_name, setLastname] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    
    const navigate = useNavigate();

    const saveProduct = async (e) => {
      e.preventDefault();
      if (!first_name.trim() || !last_name.trim() || !password || !email.trim()) {
        setToastMessage('Please fill all the fields.');
        setShowToast(true);
        return;
      }

      let credential;
      try {
          credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          await setDoc(doc(db, 'users', credential.user.uid), {
              first_name: first_name.trim(),
              last_name: last_name.trim(),
              email: credential.user.email,
              user_lvl: '2',
              created_at: serverTimestamp(),
          });
      } catch (error) {
          console.error('Error:', error);
          if (credential && auth.currentUser?.uid === credential.user.uid) {
              try {
                  await deleteUser(credential.user);
              } catch (cleanupError) {
                  console.error('Unable to remove the incomplete Firebase account:', cleanupError);
              }
          }
          setToastMessage('Unable to create your account. Check your details and try again.');
          setShowToast(true);
          return;
      }

      try {
          await signOut(auth);
      } catch (error) {
          console.error('Unable to sign out after Firebase signup:', error);
          setToastMessage('Account created and awaiting approval. Please sign out before closing this page.');
          setShowToast(true);
          return;
      }

      setShowToast(true);
      setToastMessage('Signup successful! Your account is awaiting approval.');
      setTimeout(() => {
          setShowToast(false);
          navigate('/');
      }, 3000);
    }

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
                        <div>
                        <form onSubmit={saveProduct}>
                          <h5 className="fw-normal mb-3 pb-3" style={{ letterSpacing: '1px' }}>Create your account</h5>
                          <div className="form-outline mb-4">
                            <h6>First Name</h6>
                            <input type="text" id="first_name" className="form-control form-control-lg" value={first_name} onChange={(e) => setFirstname(e.target.value)} />
                          </div>
                          <div className="form-outline mb-4">
                            <h6>Last Name</h6>
                            <input type="text" id="last_name" className="form-control form-control-lg" value={last_name} onChange={(e) => setLastname(e.target.value)} />
                          </div>
                          {/* <div className="form-outline mb-4">
                            <h6>Username</h6>
                            <input type="text" id="username" className="form-control form-control-lg" value={username} onChange={(e) => setUsername(e.target.value)} />
                          </div> */}
                          <div className="form-outline mb-4">
                            <h6>Email</h6>
                            <input type="email" id="email" className="form-control form-control-lg" value={email} onChange={(e) => setEmail(e.target.value)} required />
                          </div>
                          <div className="form-outline mb-4">
                            <h6>Password</h6>
                            <input type="password" id="password" className="form-control form-control-lg" value={password} onChange={(e) => setPassword(e.target.value)} minLength="6" required />
                          </div>
                          <div className="pt-1 mb-4">
                            <button className="btn btn-lg" style={{ backgroundColor: '#0e2238', color: '#ffffff' }}>Sign Up</button>
                          </div>
                          <p className="mb-5 pb-lg-2" style={{ color: '#0e2238' }}>Already have an account? <Link to="/" style={{ color: '#0e2238' }}>Login here</Link></p>
                        </form>
                        </div>
                      </Card.Body>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
            <Toast show={showToast} onClose={() => setShowToast(false)} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <Toast.Header>
                <strong className="me-auto">Notification</strong>
              </Toast.Header>
              <Toast.Body>{toastMessage}</Toast.Body>
            </Toast>
          </div>
        </section>
      );
}

export default Signup;
