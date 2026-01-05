import { useNavigate } from 'react-router-dom';
import { Users, Shield } from 'lucide-react';
import logo from '../assets/ddu-logo.png';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white shadow-md py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-white">
              <img
                src={logo}
                alt="DDU College logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">Deen Dayal Upadhyaya College</h1>
              <p className="text-sm text-slate-600 mt-1">University of Delhi</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center px-4 py-12"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-6xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ReUnite AI
            </h2>
            <p className="text-xl text-slate-200 mb-2">
              Missing Person Identification System
            </p>
            <p className="text-slate-300 max-w-2xl mx-auto">
              A research-based government system to help reunite missing persons with their families
              using advanced identification technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div
              onClick={() => navigate('/user-login')}
              className="bg-white rounded-lg shadow-2xl p-8 cursor-pointer transform transition-transform hover:scale-105 hover:shadow-3xl"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-10 h-10 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 text-center mb-3">
                Citizen Login
              </h3>
              <p className="text-slate-600 text-center mb-6">
                Report a missing person and find your loved ones
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Login as Citizen
              </button>
            </div>

            <div
              onClick={() => navigate('/admin-login')}
              className="bg-white rounded-lg shadow-2xl p-8 cursor-pointer transform transition-transform hover:scale-105 hover:shadow-3xl"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-slate-700" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 text-center mb-3">
                Admin Login
              </h3>
              <p className="text-slate-600 text-center mb-6">
                Government and police officials access portal
              </p>
              <button className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Login as Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-slate-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-300">
            &copy; {new Date().getFullYear()} Deen Dayal Upadhyaya College, University of Delhi - All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
