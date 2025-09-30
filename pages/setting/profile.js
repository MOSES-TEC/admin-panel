
import Profileform from '@/components/Profileform';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react"
import { useRouter } from 'next/router';

export default function profile() {

    const [profileInfo, setProfileinfo] = useState(null);
    const [loading, setLoading] = useState(true);

    const { data: session, status } = useSession();

    useEffect(() => {
        const fetchData = async () => {
            if (session?.user?.email) {  // Assuming you have access to the user's email
                try {
                    const token = session?.user?.token;  // Assuming the token is stored in session
                    const response = await axios.get(`/api/auth/profile?email=${session?.user?.email}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,  // Send the JWT token in the Authorization header
                        },
                    });
                    setProfileinfo(response.data);
                } catch (error) {
                    console.error('Error fetching profile:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [session]);

    if (status === 'loading') {
        return <>
            <div className="flex flex-center wh_100">
                Loading...
            </div>
        </>
    }

    const router = useRouter();

    if (!session) {
        router.push('/auth/signin');
        return;
    }


    if (loading) {
        return <div className="flex flex-center wh_100">
           Loading...
        </div> // You can customize your loading indicator here
    }

    if (session) {
        return <>
            <div className="profileedit">

                <div>
                    {
                        profileInfo && (
                            <Profileform {...profileInfo} />
                        )
                    }
                </div>
            </div>
        </>
    }

}