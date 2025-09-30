import LoadingSpinner from "@/components/LoadingSpinner";
import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";


export default function ContentManager() {
    const [ loading, setLoading ] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/models");

            // sort the models by creation date in descending order
            if(response.data && response.data.length > 0) {
                const sortedModels = response.data.sort((a,b) => {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                router.push(`/manager/${sortedModels[0].name}`);
            }

        } catch (error) {
            console.error("Error in fetching models", error);
            setLoading(false);
        }
    };

    if(loading) {
        return <LoadingSpinner /> // show the loading spinner when loading
    }
};



