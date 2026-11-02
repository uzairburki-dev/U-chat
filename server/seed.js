import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

dotenv.config();

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
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    console.log('Cleared existing database records.');

    // Create demo users
    const createdUsers = [];
    for (const u of demoUsers) {
      const user = await User.create(u);
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} demo users.`);

    const [alex, sarah, david, emily] = createdUsers;

    // Create 1-to-1 conversation between Alex and Sarah
    const convoAlexSarah = await Conversation.create({
      participants: [alex._id, sarah._id],
      isGroup: false,
      unreadCounts: {
        [alex._id.toString()]: 0,
        [sarah._id.toString()]: 0
      }
    });

    const m1 = await Message.create({
      conversationId: convoAlexSarah._id,
      sender: alex._id,
      text: 'Hey Sarah! Have you checked out the new ChatBoat interface design? 🚀',
      messageType: 'text',
      readBy: [alex._id, sarah._id]
    });

    const m2 = await Message.create({
      conversationId: convoAlexSarah._id,
      sender: sarah._id,
      text: 'Yes! The glassmorphism and real-time Socket.IO synchronization look fantastic! 🌟',
      messageType: 'text',
      replyTo: m1._id,
      readBy: [alex._id, sarah._id]
    });

    const m3 = await Message.create({
      conversationId: convoAlexSarah._id,
      sender: alex._id,
      text: 'Awesome, everything is completely responsive and real-time!',
      messageType: 'text',
      readBy: [alex._id, sarah._id]
    });

    convoAlexSarah.lastMessage = m3._id;
    await convoAlexSarah.save();

    // Create group conversation "Design & Engineering"
    const groupConvo = await Conversation.create({
      groupName: '🚀 Product & Engineering Team',
      groupDescription: 'Collaborative channel for building high quality products and features.',
      groupAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      isGroup: true,
      groupAdmin: alex._id,
      participants: [alex._id, sarah._id, david._id, emily._id],
      unreadCounts: {
        [alex._id.toString()]: 0,
        [sarah._id.toString()]: 0,
        [david._id.toString()]: 0,
        [emily._id.toString()]: 0
      }
    });

    const gm1 = await Message.create({
      conversationId: groupConvo._id,
      sender: alex._id,
      text: 'Welcome team to the official ChatBoat workspace channel! 🎉',
      messageType: 'text',
      readBy: [alex._id, sarah._id, david._id]
    });

    const gm2 = await Message.create({
      conversationId: groupConvo._id,
      sender: david._id,
      text: 'All backend APIs, Socket.IO channels and MongoDB connections are tested and operational! ⚡',
      messageType: 'text',
      readBy: [alex._id, sarah._id, david._id]
    });

    groupConvo.lastMessage = gm2._id;
    await groupConvo.save();

    console.log('✅ Seeding completed successfully!');
    console.log('Demo Login credentials:');
    console.log('Username: alex | Password: password123');
    console.log('Username: sarah | Password: password123');
    console.log('Username: david | Password: password123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
