"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input"; // ShadCN Input component
import { Button } from "@/components/ui/button"; // ShadCN Button component
import { useParams } from "next/navigation";

// Supabase client setup
const supabaseUrl = "https://xgrtwbvudkzvgavqskdt.supabase.co"; // Supabase URL'inizi buraya koyun
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhncnR3YnZ1ZGt6dmdhdnFza2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNDY2MzcsImV4cCI6MjA1MDYyMjYzN30.rDTI_p4UStwOQZSnWqTbAGqCDTpqmDIMdbqFEL3GuOM"; // Public anon anahtarınızı buraya koyun
const supabase = createClient(supabaseUrl, supabaseKey);

export default function DetailsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  interface FormData {
    shareholder_1?: string;
    shareholder_2?: string;
    shareholder_3?: string;
    shareholder_4?: string;
    shareholder_5?: string;
    shareholder_6?: string;
    shareholder_7?: string;
    // Add other fields as needed
  }

  const [formData, setFormData] = useState<FormData>({}); // Store updated data

  // Fetch data when page loads
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("sacrifice_animals")
        .select("*")
        .eq("sacrifice_no", id)
        .single();
      if (error) {
        console.error(error);
      } else {
        setData(data);
        setFormData(data); // Initialize form data
      }
      setLoading(false);

      console.log(data);

    };
    fetchData();
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle save button click
  const handleSave = async () => {
    const { error } = await supabase
      .from("sacrifice_animals")
      .update(formData)
      .eq("sacrifice_no", id);
    if (error) {
      console.error("Error updating data:", error);
    } else {
      alert("Data updated successfully!");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Details for ID: {id}</h1>

      {/* Control data */}
      {data ? (
        <div className="space-y-4">

          <div>
            <label className="block mb-1 text-sm font-medium">Hissedar 1</label>
            <Input
              name="shareholder_1"
              value={formData.shareholder_1 || ""}
              onChange={handleInputChange}
            />
          </div>
          {/* <div>
            <label className="block mb-1 text-sm font-medium">Phone</label>
            <Input
              name="phone"
              value={formData.phone || ""}
              onChange={handleInputChange}
            />
          </div> */}
          {/* Save Button */}
          <Button onClick={handleSave} className="mt-4">
            Save Changes
          </Button>
        </div>
      ) : (
        <p>No data found for this ID.</p>
      )}
    </div>
  );
}
