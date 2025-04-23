import { useSacrificeStore } from "@/stores/global/useSacrificeStore";
import { useEffect, useState } from "react";

export function useSacrificeById(id: string | undefined) {
    const { sacrifices, refetchSacrifices, isLoadingSacrifices } = useSacrificeStore();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!id) {
            setData(null);
            setIsLoading(false);
            return;
        }

        // Check if we already have the data in the store
        const sacrificeInStore = sacrifices.find(s => s.sacrifice_id === id);

        if (sacrificeInStore) {
            setData(sacrificeInStore);
            setIsLoading(false);
            return;
        }

        // If not in store, fetch it
        setIsLoading(true);
        fetch(`/api/get-sacrifice-by-id?id=${id}`)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.error || "Failed to fetch sacrifice");
                    });
                }
                return response.json();
            })
            .then(fetchedData => {
                setData(fetchedData);
                setIsLoading(false);
            })
            .catch(err => {
                setError(err);
                setIsLoading(false);
            });
    }, [id, sacrifices]);

    return {
        data,
        isLoading: isLoading || isLoadingSacrifices,
        error,
        refetch: refetchSacrifices
    };
} 