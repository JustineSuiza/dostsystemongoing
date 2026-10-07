import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import EditUserProfile from './EditUserProfile';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!auth.currentUser) {
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, 'users', auth.currentUser.uid));
        setUser(snapshot.exists() ? { ...snapshot.data(), uid: snapshot.id } : null);
      } catch (error) {
        console.error('Error fetching Firebase user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, 'users', auth.currentUser.uid));
      setUser(snapshot.exists() ? { ...snapshot.data(), uid: snapshot.id } : null);
    } catch (error) {
      console.error('Error refreshing Firebase user profile:', error);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow bg-light rounded">
            <Card.Body>
              <h2 className="text-center mb-4">User Profile</h2>
              {user && (
                <div>
                  <p><strong>First Name:</strong> {user.first_name}</p>
                  <p><strong>Last Name:</strong> {user.last_name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                </div>
              )}
              <button className="btn btn-primary" onClick={() => setIsEditModalOpen(true)} disabled={!user}>
                Edit Profile
              </button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <EditUserProfile
        isEditModalOpen={isEditModalOpen}
        closeModal={() => setIsEditModalOpen(false)}
        user={user}
        refresh={refreshProfile}
      />
    </Container>
  );
};

export default UserProfile;
