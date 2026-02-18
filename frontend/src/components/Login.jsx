import { useState } from 'react';
import axios from 'axios';
import { User, Lock, Mail } from 'lucide-react';

export default function Login({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/${isLogin ? 'login' : 'register'}`, formData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            onLogin(data.user);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-900">
                    {isLogin ? 'Sign in to your account' : 'Create a new account'}
                </h2>
                {error && <div className="p-3 text-red-500 bg-red-100 rounded">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="relative">
                            <User className="absolute w-5 h-5 text-gray-400 left-3 top-3" />
                            <input
                                type="text"
                                placeholder="Username"
                                className="w-full p-2 pl-10 border rounded focus:ring-2 focus:ring-blue-500"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                    )}
                    <div className="relative">
                        <Mail className="absolute w-5 h-5 text-gray-400 left-3 top-3" />
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-2 pl-10 border rounded focus:ring-2 focus:ring-blue-500"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute w-5 h-5 text-gray-400 left-3 top-3" />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full p-2 pl-10 border rounded focus:ring-2 focus:ring-blue-500"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700">
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="w-full text-sm text-blue-600 hover:underline"
                >
                    {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                </button>
            </div>
        </div>
    );
}
