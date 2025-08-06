import { createContext, useContext, useEffect, useState } from 'react';
import { schemaBuilder, lf } from '@/clientDB/schema';
import { maybeSeed } from '@/clientDB/seeders';

type DBContextType = lf.Database | null;

const DBContext = createContext<DBContextType>(null);

export function useClientDB() {
    return useContext(DBContext);
}

export function ClientDBProvider({ children }: { children: React.ReactNode }) {
    const [db, setDb] = useState<lf.Database | null>(null);

    useEffect(() => {
        // maybeSeed should return the db instance after seeding
        maybeSeed().then((dbInstance) => {
            setDb(dbInstance);
        });
    }, []);

    return <DBContext.Provider value={db}>{children}</DBContext.Provider>;
}