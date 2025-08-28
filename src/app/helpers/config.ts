import { APP_ENV, API_URL } from '@/app/config/app';

const config = {
    app_env: APP_ENV,
    api_url: API_URL,
};

export function getConfig(key: keyof typeof config) {
    return config[key];
}

export function environment(env: string): boolean {

    return APP_ENV == env;
}