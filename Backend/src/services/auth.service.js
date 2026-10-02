const { randomUUID } = require('crypto');
const {
    findUserByEmail,
    createUser,
    findLoginUserByEmail,
    findUserById,
    updateUserProfile,
} = require('../repositories/user.repository');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

async function registerUserService({ name, email, password, role }) {

    const cleanName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
        return { statusCode: 409, message: 'email already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await createUser({
        userId: randomUUID(),
        name: cleanName,
        email: normalizedEmail,
        password: hashedPassword,
        role,
    });

    const token = jwt.sign(
        {
            id: createdUser.user_id,
            email: createdUser.email,
            name: createdUser.name,
            role: createdUser.role,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' }
    );

    return { statusCode: 201, message: 'user created successfully', data: createdUser, token };
}

async function loginUserService({ email, password }) {

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await findLoginUserByEmail(normalizedEmail);
    if (!existingUser) {
        return { statusCode: 401, message: 'invalid credentials' };
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
        return { statusCode: 401, message: 'invalid credentials' };
    }

    const token = jwt.sign(
        {
            id: existingUser.user_id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' }
    );

    const userData = {
        user_id: existingUser.user_id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        created_at: existingUser.created_at,
    };

    return {
        statusCode: 200,
        message: 'login successful',
        data: userData,
        token,
    };
}

async function getMeService({ userId }) {
    if (!userId) {
        return { statusCode: 401, message: 'unauthorized' };
    }

    const user = await findUserById(userId);
    if (!user) {
        return { statusCode: 401, message: 'user not found' };
    }

    return { statusCode: 200, data: user };
}

async function updateMeService({ userId, name, email, role, newPassword }) {
    if (!userId) {
        return { statusCode: 401, message: 'unauthorized' };
    }

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanRole = (role || '').trim();
    const allowedRoles = ['Staff Member', 'Inventory Manager'];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanName || !cleanEmail || !cleanRole) {
        return { statusCode: 400, message: 'name, email and role are required' };
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
        return { statusCode: 400, message: 'name must be between 2 and 100 characters' };
    }

    if (!emailRegex.test(cleanEmail)) {
        return { statusCode: 400, message: 'please enter a valid email address' };
    }

    if (!allowedRoles.includes(cleanRole)) {
        return { statusCode: 400, message: 'invalid role selected' };
    }

    const existing = await findUserByEmail(cleanEmail);
    if (existing && existing.user_id !== userId) {
        return { statusCode: 409, message: 'email already exists' };
    }

    let hashedPassword = null;
    if (newPassword && String(newPassword).trim()) {
        const pwd = String(newPassword);
        if (pwd.length < 6 || pwd.length > 128) {
            return { statusCode: 400, message: 'new password must be between 6 and 128 characters' };
        }
        if (!/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) {
            return { statusCode: 400, message: 'new password must contain at least one letter and one number' };
        }
        hashedPassword = await bcrypt.hash(pwd, 10);
    }

    const updated = await updateUserProfile({
        userId,
        name: cleanName,
        email: cleanEmail,
        role: cleanRole,
        password: hashedPassword,
    });

    if (!updated) {
        return { statusCode: 404, message: 'user not found' };
    }

    return { statusCode: 200, message: 'profile updated successfully', data: updated };
}

module.exports = {
    registerUserService,
    loginUserService,
    getMeService,
    updateMeService,
};
