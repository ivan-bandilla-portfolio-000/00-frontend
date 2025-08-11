import { createContext, useContext, useEffect, useState } from 'react';
import type { lf } from '@/clientDB/schema';
import { connectClientDB } from '@/clientDB/schema';

type DBContextType = lf.Database | null;

const DBContext = createContext<DBContextType>(null);

export function useClientDB() {
    return useContext(DBContext);
}

export function ClientDBProvider({ children }: { children: React.ReactNode }) {
    const [db, setDb] = useState<lf.Database | null>(null);

    useEffect(() => {
        let mounted = true;
        connectClientDB().then((dbInstance) => {
            if (mounted) setDb(dbInstance);
        });
        return () => { mounted = false; };
    }, []);

    return <DBContext.Provider value={db}>{children}</DBContext.Provider>;
}