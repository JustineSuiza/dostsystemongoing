import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import './App.css';
import BackToTopButton from './Components/BackToTopButton';
import Main from './Components/Main';
import Login from './Components/Login';
import Signup from './Components/Signup';
import ForgotPassword from './Components/ForgotPassword';
import EmailForm from './Components/EmailForm';
import { auth, db } from './firebase';

const clearLocalSession = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('user_lvl');
  localStorage.removeItem('id');
  localStorage.removeItem('first_name');
  localStorage.removeItem('last_name');
};

const getLoginErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'The email or password is incorrect. If you just reset your password, enter the new password from that reset.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/user-disabled':
      return 'This Firebase account has been disabled. Contact the project administrator.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Firebase could not be reached. Check your internet connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled for this Firebase project.';
    case 'permission-denied':
      return 'Firebase signed you in, but Firestore denied access to your profile. Contact the project administrator.';
    default:
      return 'Login failed. Please try again or use Forgot password to reset your password.';
  }
};

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        clearLocalSession();
        setLoggedIn(false);
        return;
      }

      try {
        const profile = await getDoc(doc(db, 'users', user.uid));
        if (!profile.exists() || !['0', '1'].includes(profile.data().user_lvl)) {
          clearLocalSession();
          setLoggedIn(false);
          return;
        }

        const data = profile.data();
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user_lvl', data.user_lvl);
        localStorage.setItem('id', user.uid);
        localStorage.setItem('first_name', data.first_name);
        localStorage.setItem('last_name', data.last_name);
        setLoggedIn(true);
      } catch (error) {
        console.error('Unable to load the Firebase user profile:', error);
        clearLocalSession();
        setLoggedIn(false);
      }
    });

    return unsubscribe;
  }, []);

  const handleLogin = async (email, password) => {
    let credential;
    try {
      credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error('Firebase Authentication login failed:', error);
      return { success: false, message: getLoginErrorMessage(error) };
    }

    try {
      const profile = await getDoc(doc(db, 'users', credential.user.uid));

      if (!profile.exists()) {
        await signOut(auth);
        return { success: false, message: 'This account has not been set up in Firebase yet.' };
      }

      const data = profile.data();
      if (!['0', '1'].includes(data.user_lvl)) {
        await signOut(auth);
        return {
          success: false,
          message: data.user_lvl === '2'
            ? 'Your account is awaiting approval from the admin.'
            : 'This account does not have an approved access level.',
        };
      }

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user_lvl', data.user_lvl);
      localStorage.setItem('id', credential.user.uid);
      localStorage.setItem('first_name', data.first_name);
      localStorage.setItem('last_name', data.last_name);
      setLoggedIn(true);
      return { success: true, user_lvl: data.user_lvl };
    } catch (error) {
      console.error('Firebase user profile lookup failed:', error);
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error('Unable to clear the incomplete Firebase login:', signOutError);
      }
      return { success: false, message: getLoginErrorMessage(error) };
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={loggedIn ? <Navigate to="/DOST" /> : <Navigate to="/login" />} />
        <Route path="/login" element={loggedIn ? <Navigate to="/DOST" /> : <Login handleLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/send-email" element={<EmailForm/>} />
        <Route path="/DOST/*" element={loggedIn ? <Main /> : <Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
