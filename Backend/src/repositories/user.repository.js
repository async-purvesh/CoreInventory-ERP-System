const User = require('../models/User');

async function findUserByEmail(email) {
  const user = await User.findOne({ email }).select('-password').lean();
  return user || null;
}

async function createUser({ userId, name, email, password, role }) {
  const user = await User.create({
    user_id: userId,
    name,
    email,
    password,
    role: role || null,
  });
  const { password: _, ...userData } = user.toObject();
  return userData;
}

async function findLoginUserByEmail(email) {
  const user = await User.findOne({ email }).lean();
  return user || null;
}

async function findUserById(userId) {
  const user = await User.findOne({ user_id: userId }).select('-password').lean();
  return user || null;
}

async function updateUserProfile({ userId, name, email, role, password }) {
  const updateFields = { name, email, role };
  if (password) {
    updateFields.password = password;
  }
  const user = await User.findOneAndUpdate(
    { user_id: userId },
    { $set: updateFields },
    { new: true, projection: { password: 0 } }
  ).lean();
  return user || null;
}

async function updateUserPassword(userId, password) {
  const user = await User.findOneAndUpdate(
    { user_id: userId },
    { $set: { password } },
    { new: true, projection: { password: 0 } }
  ).lean();
  return user || null;
}

module.exports = {
  findUserByEmail,
  createUser,
  findLoginUserByEmail,
  findUserById,
  updateUserProfile,
  updateUserPassword,
};
