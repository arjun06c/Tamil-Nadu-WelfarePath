import mongoose from 'mongoose';

const testUsernames = [
  'arjun123', 'arjun2026', 'tnwelfare', 'welfarepath', 'dbUser', 
  'appUser', 'welfare_admin', 'tn_welfare', 'student', 'dev', 'developer'
];
const password = 'Y1vUvjLSTeTVi0RO';
const cluster = 'cluster0.qlafckz.mongodb.net';

async function testConnections() {
  for (const user of testUsernames) {
    const uri = `mongodb+srv://${user}:${password}@${cluster}/tn_welfarepath?retryWrites=true&w=majority`;
    console.log(`Testing username: ${user}...`);
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
      console.log(`🎉 SUCCESS! Connected with username: ${user}`);
      await mongoose.disconnect();
      return user;
    } catch (err: any) {
      console.log(`❌ Failed for ${user}: ${err.message}`);
    }
  }
}

testConnections();
