import { environment } from '@infrastructure/config/environment';
import { Pool } from 'pg';

export default function makeDatabase() {
    const pool = new Pool({
        user: environment.POSTGRES.USER,
        host: environment.POSTGRES.HOST,
        database: environment.POSTGRES.DB,
        password: environment.POSTGRES.PASSWORD,
        port: environment.POSTGRES.PORT,
    });

    return Object.freeze({
        query: (text: string, params?: any[]) => pool.query(text, params),
        getClient: () => pool.connect(),
        end: () => pool.end()
    });
}