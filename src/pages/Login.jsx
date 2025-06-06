import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function LoginHeader() {
  const navigate = useNavigate();
  return (
    <div data-layer="AppHeader" className="Appheader w-full border-b-[0.25px] border-slate-600 inline-flex flex-col justify-start items-start">
      <div data-layer="PageLabelWrapper" className="Pagelabelwrapper self-stretch px-5 pt-10 pb-5 bg-stone-50 border-b-[0.25px] border-slate-600 flex flex-col justify-start items-start gap-2">
        <div data-svg-wrapper data-layer="arrow-narrow-left" className="ArrowNarrowLeft relative cursor-pointer" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M7.70703 14.707C7.5195 14.8945 7.26519 14.9998 7.00003 14.9998C6.73487 14.9998 6.48056 14.8945 6.29303 14.707L2.29303 10.707C2.10556 10.5195 2.00024 10.2652 2.00024 10C2.00024 9.73483 2.10556 9.48053 2.29303 9.293L6.29303 5.293C6.48163 5.11084 6.73424 5.01005 6.99643 5.01232C7.25863 5.0146 7.50944 5.11977 7.69485 5.30518C7.88026 5.49059 7.98543 5.7414 7.9877 6.0036C7.98998 6.26579 7.88919 6.5184 7.70703 6.707L5.41403 9H17C17.2652 9 17.5196 9.10536 17.7071 9.29289C17.8947 9.48043 18 9.73478 18 10C18 10.2652 17.8947 10.5196 17.7071 10.7071C17.5196 10.8946 17.2652 11 17 11H5.41403L7.70703 13.293C7.8945 13.4805 7.99982 13.7348 7.99982 14C7.99982 14.2652 7.8945 14.5195 7.70703 14.707Z" fill="#3F3F46"/>
          </svg>
        </div>
        <div data-layer="HeadingSymbolWrapper" className="Headingsymbolwrapper self-stretch inline-flex justify-start items-center">
          <div data-layer="Heading" className="Heading flex-1 justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">Swipe.fit</div>
        </div>
        <div data-layer="SubHeading" className="Subheading self-stretch justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Login or create an account</div>
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else navigate('/');
  };

  return (
    <div>
      <LoginHeader />
      <div data-layer="GlobalContentWrapper" className="Globalcontentwrapper w-full h-[782px] px-5 py-2.5 inline-flex flex-col justify-center items-center gap-2.5">
        <div data-layer="LoginWrapper" className="Loginwrapper self-stretch flex flex-col justify-start items-start gap-5">
          <div data-layer="Sign in" className="SignIn self-stretch justify-center text-slate-600 text-2xl font-normal font-['Space_Grotesk'] leading-9">Sign in</div>
          <div data-layer="UsernamePasswordWrapper" className="Usernamepasswordwrapper self-stretch flex flex-col justify-start items-start gap-1">
            <form data-layer="UsernamePasswordForm" className="Usernamepasswordform self-stretch bg-neutral-300 rounded-sm outline outline-1 outline-offset-[-0.50px] outline-neutral-300 flex flex-col justify-start items-start gap-px overflow-hidden" onSubmit={handleLogin}>
              <div data-layer="FormFeild" className="Formfeild self-stretch flex flex-col justify-start items-start">
                <div data-layer="TextField" className="Textfield self-stretch h-14 px-4 py-2.5 bg-white border-b border-neutral-300 inline-flex justify-start items-center gap-1">
                  <input
                    className="FeildLabel flex-1 justify-center text-slate-500 text-xl font-normal font-['Space_Grotesk'] leading-loose bg-transparent border-none outline-none"
                    placeholder="Username"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div data-layer="TextField" className="Textfield self-stretch h-14 px-4 py-2.5 bg-white inline-flex justify-start items-center gap-1">
                  <input
                    className="FeildLabel flex-1 justify-center text-slate-500 text-xl font-normal font-['Space_Grotesk'] leading-loose bg-transparent border-none outline-none"
                    placeholder="Password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <div data-svg-wrapper data-layer="eye" className="Eye relative">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 12C10.5304 12 11.0391 11.7893 11.4142 11.4142C11.7893 11.0391 12 10.5304 12 10C12 9.46957 11.7893 8.96086 11.4142 8.58579C11.0391 8.21071 10.5304 8 10 8C9.46957 8 8.96086 8.21071 8.58579 8.58579C8.21071 8.96086 8 9.46957 8 10C8 10.5304 8.21071 11.0391 8.58579 11.4142C8.96086 11.7893 9.46957 12 10 12Z" fill="#D4D4D4"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M0.458008 10C1.73201 5.943 5.52201 3 10 3C14.478 3 18.268 5.943 19.542 10C18.268 14.057 14.478 17 10 17C5.52201 17 1.73201 14.057 0.458008 10ZM14 10C14 11.0609 13.5786 12.0783 12.8284 12.8284C12.0783 13.5786 11.0609 14 10 14C8.93914 14 7.92173 13.5786 7.17158 12.8284C6.42143 12.0783 6.00001 11.0609 6.00001 10C6.00001 8.93913 6.42143 7.92172 7.17158 7.17157C7.92173 6.42143 8.93914 6 10 6C11.0609 6 12.0783 6.42143 12.8284 7.17157C13.5786 7.92172 14 8.93913 14 10V10Z" fill="#D4D4D4"/>
                    </svg>
                  </div>
                </div>
              </div>
              {error && <div style={{ color: 'red', width: '100%' }}>{error}</div>}
            </form>
            <div data-layer="Forgot password?" className="ForgotPassword self-stretch justify-center text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Forgot password?</div>
          </div>
          <div data-layer="LoginOrCreateAccount" className="Loginorcreateaccount self-stretch flex flex-col justify-start items-start gap-1">
            <button
              type="submit"
              form=""
              data-layer="Button"
              className="Button self-stretch px-6 py-4 bg-stone-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center gap-6 overflow-hidden"
              disabled={loading}
              onClick={handleLogin}
            >
              <div data-layer="Add another exercise" className="AddAnotherExercise flex-1 text-center justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Login</div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/create-account')}
              data-layer="or create an account"
              className="OrCreateAnAccount self-stretch justify-center text-slate-500 text-base font-normal font-['Space_Grotesk'] leading-normal bg-transparent border-none cursor-pointer"
            >
              or create an account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 