// This code is used for the seed functionality - populates demo data for the assessment/demo.
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const Feedback = require('./models/Feedback');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const SEED_PASSWORD = process.env.SEED_PASSWORD || 'password123';

const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const importData = async () => {
    try {
        await User.deleteMany();
        await Event.deleteMany();
        await Registration.deleteMany();
        await Feedback.deleteMany();

        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: SEED_PASSWORD,
            role: 'admin'
        });

        // A regular (non-admin) user, useful for demoing registration/feedback as an attendee
        const demoUser = await User.create({
            name: 'Demo Attendee',
            email: 'demo@example.com',
            password: SEED_PASSWORD,
            role: 'user'
        });

        // A second attendee who already holds a seat in the small Yoga Retreat (for the "last seat" demo)
        const guestUser = await User.create({
            name: 'Guest Attendee',
            email: 'guest@example.com',
            password: SEED_PASSWORD,
            role: 'user'
        });

        // Two PAST events (to demo attendance + post-event feedback) and two UPCOMING events (to demo live registration)
        const [pastConference, pastFestival, upcomingPitch, upcomingRetreat] = await Event.create([
            {
                title: 'Tech Conference 2026',
                description: 'Annual technology conference covering the latest in AI and Web Dev.',
                date: daysFromNow(-14),
                category: 'Professional Events',
                imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
                user: adminUser._id,
                coordinatorName: 'Rahul Mehta',
                coordinatorPhone: '918766065795',
                entryFee: 500,
                capacity: 200,
                registeredCount: 1,
                sessions: [
                    { title: 'Opening Keynote', speaker: 'Anita Rao', startTime: '09:00 AM', endTime: '10:00 AM' },
                    { title: 'The Future of AI Agents', speaker: 'Rahul Mehta', startTime: '10:30 AM', endTime: '11:30 AM' },
                    { title: 'Panel: Scaling Startups', speaker: 'Priya Nair & Sam Verma', startTime: '01:00 PM', endTime: '02:00 PM' }
                ]
            },
            {
                title: 'Music Festival 2026',
                description: 'A weekend full of live bands and DJ sets!',
                date: daysFromNow(-7),
                category: 'Celebration',
                imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800&auto=format&fit=crop',
                user: adminUser._id,
                coordinatorName: 'Priya Nair',
                coordinatorPhone: '919876543210',
                entryFee: 800,
                capacity: 500,
                registeredCount: 1,
                sessions: [
                    { title: 'Main Stage: Opening Act', speaker: 'The Wanderers', startTime: '05:00 PM' },
                    { title: 'Headline Performance', speaker: 'DJ Nova', startTime: '08:00 PM' }
                ]
            },
            {
                title: 'Startup Pitch Night',
                description: 'Watch new startups pitch their ideas to investors.',
                date: daysFromNow(5),
                category: 'Professional Events',
                imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop',
                user: adminUser._id,
                coordinatorName: 'Sam Verma',
                coordinatorPhone: '917000112233',
                entryFee: 200,
                capacity: 50,
                registeredCount: 1,
                sessions: [
                    { title: 'Pitch Round 1', speaker: '5 Founding Teams', startTime: '06:00 PM', endTime: '07:00 PM' },
                    { title: 'Investor Q&A', speaker: 'Panel of VCs', startTime: '07:15 PM' }
                ]
            },
            {
                title: 'Yoga Retreat',
                description: 'Relax and unwind with our weekend yoga retreat in the mountains.',
                date: daysFromNow(15),
                category: 'Anniversary',
                imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop',
                user: adminUser._id,
                coordinatorName: 'Anita Rao',
                coordinatorPhone: '916655443322',
                entryFee: 0,
                capacity: 2, // tiny on purpose: 1 seat is taken by the guest, so the demo user takes the LAST seat
                registeredCount: 1
            }
        ]);

        // Demo user registered for both past events, admin already marked them attended
        await Registration.create([
            { user: demoUser._id, event: pastConference._id, attended: true, paymentStatus: 'paid', amountPaid: 500, paymentMethod: 'UPI', paymentRef: 'SIM-SEED0001' },
            { user: demoUser._id, event: pastFestival._id, attended: true, paymentStatus: 'paid', amountPaid: 800, paymentMethod: 'Card', paymentRef: 'SIM-SEED0002' },
            { user: demoUser._id, event: upcomingPitch._id, attended: false, paymentStatus: 'paid', amountPaid: 200, paymentMethod: 'UPI', paymentRef: 'SIM-SEED0003' },
            { user: guestUser._id, event: upcomingRetreat._id, attended: false }
        ]);

        // Feedback already exists for the Tech Conference only.
        // The Music Festival is left empty on purpose so you can submit feedback LIVE as demo@example.com.
        await Feedback.create([
            { user: demoUser._id, event: pastConference._id, rating: 5, comment: 'Loved the AI agents talk, very insightful!' }
        ]);

        console.log('Data Imported!');
        console.log(`Admin login: admin@example.com / ${SEED_PASSWORD}`);
        console.log(`Demo user login: demo@example.com / ${SEED_PASSWORD}`);
        console.log(`Second attendee: guest@example.com / ${SEED_PASSWORD}`);
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
