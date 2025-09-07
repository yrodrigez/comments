import "dotenv/config";

function createEnviroment() {
    if (!process.env.POSTGRES_PASSWORD) {
        throw new Error("POSTGRES_PASSWORD is not set in environment variables");
    }
    
    if (!process.env.POSTGRES_USER) {
        throw new Error("POSTGRES_USER is not set in environment variables");
    }

    if (!process.env.POSTGRES_DB) {
        throw new Error("POSTGRES_DB is not set in environment variables");
    }

    if (!process.env.POSTGRES_HOST) {
        throw new Error("POSTGRES_HOST is not set in environment variables");
    }

    if (!process.env.POSTGRES_PORT) {
        throw new Error("POSTGRES_PORT is not set in environment variables");
    }

    return Object.freeze({
        NODE_ENV: process.env.NODE_ENV || "production",
        PORT: parseInt(process.env.PORT!, 10) || 3000,
        POSTGRES: {
            PASSWORD: process.env.POSTGRES_PASSWORD,
            USER: process.env.POSTGRES_USER,
            DB: process.env.POSTGRES_DB,
            HOST: process.env.POSTGRES_HOST,
            PORT: parseInt(process.env.POSTGRES_PORT!, 10),
        }
    })
}

export const environment = createEnviroment();