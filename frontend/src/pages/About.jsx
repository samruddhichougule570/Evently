import React from 'react';

const About = () => {
    return (
        <div className="max-w-4xl mx-auto mt-12 bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100">
            
            <h1 className="text-4xl font-extrabold text-slate-800 mb-6 text-center">
                About Evently
            </h1>

            <div className="space-y-8 text-lg text-slate-600 leading-relaxed font-light">

                {/* Image */}
                <div className="w-full h-80 rounded-2xl overflow-hidden shadow-md">
                    <img 
                        src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1200&auto=format&fit=crop" 
                        alt="Event Conference" 
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Intro */}
                <p>
                    Welcome to <span className="font-semibold text-indigo-600">Evently</span>, your premier platform for managing and discovering exceptional events. Our mission is to simplify the process of hosting and attending events, whether they are professional conferences, joyous celebrations, or intimate gatherings.
                </p>

                {/* Vision + What We Do */}
                <div className="grid md:grid-cols-2 gap-8 mt-8">

                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                        <h3 className="text-xl font-bold text-indigo-800 mb-3">Our Vision</h3>
                        <p className="text-indigo-900/80 text-base">
                            We believe that bringing people together should be effortless and inspiring. Evently provides the tools you need to create memorable experiences without the typical administrative hassle.
                        </p>
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                        <h3 className="text-xl font-bold text-emerald-800 mb-3">What We Do</h3>
                        <p className="text-emerald-900/80 text-base">
                            From robust ticketing to seamless user management and beautiful event showcases, Evently is built on the modern MERN stack to deliver a fast, reliable, and secure platform for all your event coordination needs.
                        </p>
                    </div>

                </div>

                {/* Outro */}
                <p>
                    Our team is dedicated to continuous improvement and innovation. We regularly update Evently with new features to better serve our diverse community of organizers and attendees. Join us in making event management a breeze!
                </p>

                {/* Know More Section */}
                <div className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 p-8 rounded-2xl border border-indigo-200 mt-12 shadow-lg">
                    
                    <h2 className="text-2xl font-bold text-indigo-800 mb-6 border-b border-indigo-300 pb-4">
                        Know More
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">

                        {/* Info */}
                        <div className="space-y-4 text-base text-slate-700 mt-4">
                            <p><strong>Event Manager:</strong> Samruddhi Dilip Chougule</p>
                            <p><strong>Address:</strong> 101 Evently Tower, Tech Park, City Center</p>
                            <p><strong>Email:</strong> samruddhi.chougule@evently.com</p>
                            <p>
                                <strong>Phone:</strong>{" "}
                                <a href="tel:+918766065795" className="text-indigo-600 hover:underline">
                                    +91 8766065795
                                </a>
                            </p>
                        </div>

                        {/* Live Google Map embed */}
                        <div className="w-full h-48 md:h-full rounded-xl overflow-hidden border border-indigo-200 shadow-md min-h-[200px]">
                            <iframe
                                title="Evently HQ Location"
                                src="https://www.google.com/maps?q=Tech+Park+City+Center&output=embed"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
};

export default About;