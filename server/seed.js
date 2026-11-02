import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  console.error('⛔ Seeding demo data is disabled in production to protect genuine data.');
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chatboat';

const demoUsers = [
  {
    username: 'alex',
    email: 'alex@chatboat.io',
    password: 'password123',
    fullName: 'Alex Morgan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Product Designer & UI/UX enthusiast 🎨',
    status: 'online',
    customStatus: 'Designing new interfaces ✨'
  },
  {
    username: 'sarah',
    email: 'sarah@chatboat.io',
    password: 'password123',
    fullName: 'Sarah Connor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Senior Full Stack Engineer | React & Node 💻',
    status: 'online',
    customStatus: 'Coding something cool 🚀'
  },
  {
    username: 'david',
    email: 'david@chatboat.io',
    password: 'password123',
    fullName: 'David Miller',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'DevOps & Cloud Architect ☁️',
    status: 'away',
    customStatus: 'In a meeting 📅'
  },
  {
    username: 'emily',
    email: 'emily@chatboat.io',
    password: 'password123',
    fullName: 'Emily Watson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    bio: 'AI researcher & deep learning advocate 🤖',
    status: 'offline',
    customStatus: 'Reading research papers 📚'
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to development MongoDB instance for seeding...');

    // Remove only demo users
    const demoUsernames = demoUsers.map((u) => u.username);
    await User.deleteMany({ username: { $in: demoUsernames } });
    console.log('Cleared previous development demo records.');

    // Create demo users
    const createdUsers = [];
    for (const u of demoUsers) {
      const user = await User.create({
        ...u,
        isEmailVerified: true
      });
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} development test users.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedData();
