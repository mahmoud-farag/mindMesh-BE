import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
const ssmClient = new SSMClient({});


// Cache for SSM parameters to avoid repeated calls


let cache = {};


cache.getMongoURI = async () => {
    if (cache?.configs?.mongoUri) {
        return cache.configs.mongoUri;
    }

    const response = await ssmClient.send(new GetParameterCommand({
        Name: '/mindMesh/mongoURI',
        WithDecryption: true,
    }));

    cache.configs = cache.configs || {};
    cache.configs.mongoUri = response.Parameter.Value;

    return cache.configs.mongoUri;
}




cache.getGeminiAPiKey = async () => {

    if (cache?.configs?.geminiApIKey) {
        return cache.configs.geminiApIKey;
    }


    const response = await ssmClient.send(new GetParameterCommand({
        Name: '/mindMesh/geminiAPIKey',
        WithDecryption: true,

    }));

    cache.configs = cache.configs || {};
    cache.configs.geminiApIKey = response.Parameter.Value;

    return cache.configs.geminiApIKey;

}

export default cache;
