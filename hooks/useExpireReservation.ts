import { useMutation } from "@tanstack/react-query";

interface ExpireReservationParams {
    transaction_id: string;
}

export const useExpireReservation = () => {
    return useMutation({
        mutationFn: async (params: ExpireReservationParams) => {
            const response = await fetch("/api/expire-reservation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to expire reservation");
            }

            return await response.json();
        },
    });
}; 