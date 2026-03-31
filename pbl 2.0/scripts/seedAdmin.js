'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/college_events';

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@college.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'System Admin';

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log(`Admin user already exists: ${adminEmail}`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(adminPassword, salt);

    await User.create({
      name: adminName,
      email: adminEmail,
      password: hashed,
      role: 'admin',
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   Please change the password after first login.');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seed();
