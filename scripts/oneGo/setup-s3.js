import 'dotenv/config'; // Load environment variables
import awsService from '../../src/services/aws-service.js';

async function setupS3() {
    try {
        console.log('Starting S3 Setup...');

        // Define CORS rules
        const corsRules = [
            {
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
                AllowedOrigins: ["http://localhost:5173", "https://mindmeshf.vercel.app"],
                ExposeHeaders: [],
                MaxAgeSeconds: 3000
            }
        ];

        console.log('Applying CORS policy...');
        await awsService.setCorsPolicy(corsRules);

        console.log('S3 CORS policy configured successfully!');
    } catch (error) {
        console.error('Failed to setup S3:', error);
        process.exit(1);
    }
}

setupS3();
