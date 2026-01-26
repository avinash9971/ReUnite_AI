import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import logo from '../assets/ddu-logo.png';


export function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* left: logo + title */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-white">
              <img
                src={logo}
                alt="DDU College logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">BringHome AI</h1>
              <p className="text-sm text-slate-600">Missing Person Identification System</p>
            </div>
          </div>

          {/* right: user / sign out */}
          <div className="flex items-center space-x-4">
            {user && profile ? (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{profile.full_name || profile.email}</p>
                  <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 py-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-white">
            Deen Dayal Upadhyaya College, University of Delhi
          </p>
        </div>
      </div>
    </header>
  );
}
