const app = require('./src/app');
const { connectDB } = require('./src/config/database');

const startServer = async () => {
    try {
        await connectDB();

        app.listen(3000, () => {
            console.log('server is running on localhost:3000');
        });
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
};

startServer();