import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import { app } from '../firebase';
import { useDispatch } from 'react-redux';
import { signInSuccess } from '../redux/user/userSlice';
import { useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa'; // Google Icon for better UI

export default function OAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleClick = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const auth = getAuth(app);

      // 1. Firebase Popup Open karein
      const result = await signInWithPopup(auth, provider);

      // 2. Data Backend ko bhejein
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: result.user.displayName,
          email: result.user.email,
          photo: result.user.photoURL,
        }),
      });

      const data = await res.json();

      // 3. Agar Backend ne success diya, to Redux update karein
      dispatch(signInSuccess(data));
      navigate('/');
      
    } catch (error) {
      console.log('Could not sign in with google', error);
    }
  };

  return (
    // type='button' zaroori hai taaki ye form submit na kar de
    <button
      onClick={handleGoogleClick}
      type='button'
      className='bg-red-700 text-white p-3 rounded-lg uppercase hover:bg-red-800 transition-colors shadow-md flex items-center justify-center gap-2 font-semibold'
    >
      <FaGoogle className='text-lg' />
      Continue with Google
    </button>
  );
}