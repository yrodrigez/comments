import {Pool} from 'pg';


export default function makeDatabase() {
    const pool = new Pool({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
    });

    return Object.freeze({
        query: (text: string, params?: any[]) => pool.query(text, params),
        getClient: () => pool.connect(),
        end: () => pool.end()
    });
}