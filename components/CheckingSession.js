import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";


export default function CheckingSession({ children, enabled = true }) {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if(!enabled) return;
        if(status === "unauthenticated") {
            router.push('/auth/signin');
        }
    }, [status, router, enabled]);

    if(enabled && status === 'loading') {
        return <LoadingSpinner />
    }

    return <>
        {children}
    </>
};







