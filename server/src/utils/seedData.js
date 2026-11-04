import { User } from '../models/User.js';
import { Official } from '../models/Official.js';
import { Status } from '../models/Status.js';
import { getTodayDateString } from './dateHelper.js';

export const seedDatabaseIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    let adminUser = null;
    let associateUser = null;
    let internUser = null;

    if (userCount === 0) {
      console.log('🌱 Seeding initial chamber users...');
      adminUser = await User.create({
        name: 'Sr. Adv. Vikramaditya Sharma',
        email: 'admin@legalchambers.com',
        password: 'admin123',
        role: 'admin',
        title: 'Managing Counsel',
        contributionsCount: 18,
        approvedEditsCount: 18,
        points: 180,
      });

      associateUser = await User.create({
        name: 'Advocate Ravi Verma',
        email: 'ravi@legalchambers.com',
        password: 'ravi123',
        role: 'member',
        title: 'Senior Associate',
        contributionsCount: 12,
        approvedEditsCount: 12,
        points: 120,
      });

      internUser = await User.create({
        name: 'Priya Nair',
        email: 'priya@legalchambers.com',
        password: 'priya123',
        role: 'member',
        title: 'Chamber Intern',
        contributionsCount: 6,
        approvedEditsCount: 6,
        points: 60,
      });
      console.log('✅ Users seeded successfully.');
    } else {
      adminUser = await User.findOne({ role: 'admin' });
      associateUser = await User.findOne({ email: 'ravi@legalchambers.com' }) || adminUser;
      internUser = await User.findOne({ email: 'priya@legalchambers.com' }) || adminUser;

      // Ensure existing users have points if they were 0
      if (internUser && (!internUser.contributionsCount || internUser.contributionsCount === 0)) {
        await User.updateOne({ email: 'admin@legalchambers.com' }, { $set: { contributionsCount: 18, approvedEditsCount: 18, points: 180 } });
        await User.updateOne({ email: 'ravi@legalchambers.com' }, { $set: { contributionsCount: 12, approvedEditsCount: 12, points: 120 } });
        await User.updateOne({ email: 'priya@legalchambers.com' }, { $set: { contributionsCount: 6, approvedEditsCount: 6, points: 60 } });
      }
    }

    const officialCount = await Official.countDocuments();
    if (officialCount === 0) {
      console.log('🌱 Seeding initial court officials...');
      const officialsData = [
        {
          name: 'Hon’ble Chief Justice Mahesh Chandra Tripathi',
          designation: 'Chief Justice',
          court: 'High Court of Bombay - Mumbai',
          benchOrRoom: 'Chief Justice Court',
          notes: 'Principal Seat · Sample demo entry',
          active: true,
        },
        {
          name: 'Hon’ble Justice A.S. Gadkari',
          designation: 'Judge',
          court: 'High Court of Bombay - Mumbai',
          benchOrRoom: 'Court Room 2',
          notes: 'Principal Seat · Sample demo entry',
          active: true,
        },
        {
          name: 'Hon’ble Justice G.S. Kulkarni',
          designation: 'Judge',
          court: 'High Court of Bombay - Mumbai',
          benchOrRoom: 'Court Room 3',
          notes: 'Principal Seat · Sample demo entry',
          active: true,
        },
        {
          name: 'Hon’ble Justice B.P. Colabawalla',
          designation: 'Judge',
          court: 'High Court of Bombay - Mumbai',
          benchOrRoom: 'Court Room 4',
          notes: 'Principal Seat · Sample demo entry',
          active: true,
        },
        {
          name: 'Hon’ble Justice Suman Shyam',
          designation: 'Judge',
          court: 'High Court of Bombay - Mumbai',
          benchOrRoom: 'Court Room 5',
          notes: 'Principal Seat · Sample demo entry',
          active: true,
        },
        {
          name: 'Hon’ble Justice M.S. Karnik',
          designation: 'Judge',
          court: 'High Court of Bombay - Mumbai',
          benchOrRoom: 'Court Room 6',
          notes: 'Principal Seat · Sample demo entry',
          active: true,
        },
        {
          name: 'Hon’ble Justice Bharati Dangre',
          designation: 'Judge',
          court: 'High Court of Bombay - Mumbai',
          benchOrRoom: 'Court Room 7',
          notes: 'Principal Seat · Sample demo entry',
          active: true,
        },
        {
          name: 'Hon’ble Justice S.V. Kotwal',
          designation: 'Judge',
          court: 'High Court of Bombay - Mumbai',
          benchOrRoom: 'Court Room 8',
          notes: 'Principal Seat · Sample demo entry',
          active: true,
        },
        {
          name: 'Hon’ble Justice Pravin S. Patil',
          designation: 'Judge',
          court: 'High Court of Bombay - Nagpur Bench',
          benchOrRoom: 'Court Room 1',
          notes: 'Nagpur Bench · Sample demo entry',
          active: true,
        },
        {
          name: 'Hon’ble Justice Mangesh S. Patil',
          designation: 'Judge',
          court: 'High Court of Bombay - Aurangabad Bench',
          benchOrRoom: 'Court Room 1',
          notes: 'Aurangabad Bench · Sample demo entry',
          active: true,
        },
        {
          name: 'Hon’ble Justice Shailesh P. Brahme',
          designation: 'Judge',
          court: 'High Court of Bombay - Aurangabad Bench',
          benchOrRoom: 'Court Room 2',
          notes: 'Aurangabad Bench · Sample demo entry',
          active: true,
        },
      ];

      const createdOfficials = await Official.insertMany(officialsData);
      console.log(`✅ Seeded ${createdOfficials.length} officials.`);

      // Seed sample statuses for the demo board.
      const today = getTodayDateString();
      await Status.create([
        {
          official: createdOfficials[1]._id, // Justice A.S. Gadkari
          state: 'available',
          note: 'Sample demo status',
          dateString: today,
          reportedBy: associateUser._id,
        },
        {
          official: createdOfficials[2]._id, // Justice G.S. Kulkarni
          state: 'running_late',
          note: 'Sample demo status',
          dateString: today,
          reportedBy: internUser._id,
        },
        {
          official: createdOfficials[3]._id, // Justice B.P. Colabawalla
          state: 'not_sitting',
          note: 'Sample demo status',
          dateString: today,
          reportedBy: associateUser._id,
        },
        {
          official: createdOfficials[8]._id, // Nagpur Bench
          state: 'on_leave',
          note: 'Sample demo status',
          dateString: today,
          reportedBy: internUser._id,
        },
      ]);
      console.log('Sample initial statuses created for today.');
    }

  } catch (error) {
    console.error('⚠️ Seeding error:', error.message);
  }
};
