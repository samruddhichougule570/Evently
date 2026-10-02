// This code is used for the Contact page to display specific views to the user.
import { useState } from 'react';
import axios from 'axios';
import { Send, CheckCircle } from 'lucide-react';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState(null); // 'success', 'error', 'loading'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await axios.post('http://localhost:5000/api/messages', formData);
            setStatus('success');
            setFormData({ name: '', email: '', message: '' });
        } catch {
            setStatus('error');
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-12 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-6 text-center">Get in Touch</h2>
            <p className="text-slate-500 text-center mb-8">Have a question or want to host an event? Send us a message!</p>
            
            {status === 'success' && (
                <div className="mb-8 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-3">
                    <CheckCircle className="text-green-500" />
                    <span>Your message has been sent successfully. We'll get back to you soon.</span>
                </div>
            )}

            {status === 'error' && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl">
                    Failed to send message. Please try again.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            required 
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                    <textarea 
                        name="message"
                        value={formData.message} 
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        rows="5"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                        required 
                    ></textarea>
                </div>
                <button 
                    type="submit" 
                    disabled={status === 'loading'}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {status === 'loading' ? 'Sending...' : (
                        <>
                            Send Message
                            <Send size={18} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default Contact;
