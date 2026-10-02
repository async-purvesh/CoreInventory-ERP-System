const {
    registerUserService,
    loginUserService,
    getMeService,
    updateMeService,
} = require('../services/auth.service');

async function registerUser(req, res) {
    const { name, email, password, role } = req.body;

    const user = await registerUserService({
        name,
        email,
        password,
        role,
    });

    if (user.statusCode !== 201) {
        return res.status(user.statusCode).json(user.message)
    }

    res.cookie('JWT_Token', user.token);

    return res.status(201).json({user: user.data, token: user.token, message: user.message})
}

async function loginUser(req, res) {
    const { email, password } = req.body;

    const user = await loginUserService({
        email,
        password,
    });

    if (user.statusCode !== 200) {
        return res.status(user.statusCode).json(user.message);
    }

    res.cookie('JWT_Token', user.token);

    return res.status(200).json({ user: user.data, token: user.token, message: user.message });
}

async function getMe(req, res) {
    const result = await getMeService({ userId: req.user?.id });
    if (result.statusCode !== 200) {
        return res.status(result.statusCode).json({ message: result.message });
    }
    return res.status(200).json({ data: result.data });
}

async function updateMe(req, res) {
    const { name, email, role, newPassword } = req.body;
    const result = await updateMeService({
        userId: req.user?.id,
        name,
        email,
        role,
        newPassword,
    });

    if (result.statusCode !== 200) {
        return res.status(result.statusCode).json({ message: result.message });
    }

    return res.status(200).json({ data: result.data, message: result.message });
}

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateMe,
};