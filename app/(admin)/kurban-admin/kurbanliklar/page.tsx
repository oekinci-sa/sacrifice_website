"use client";
import { useEffect, useState } from "react";

// import { Metadata } from "next";

// Supabase
import { fetchTableData } from "@/helpers/supabase";
import { sacrificeSchema } from "@/types"

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

// export const sacrificeSchema = z.object({
//   sacrifice_no: z.number(),
//   sacrifice_time: z.string(),
//   share_price: z.number(),
//   empty_share: z.number(),
//   notes: z.string().nullable(),
//   sacrifice_id: z.number(),
//   added_at: z.string(),
// });

// Simulate a database read for tasks.
// async function getTasks() {
//   const data = await fs.readFile(
//     path.join(
//       process.cwd(),
//       "app/(admin)/kurban-admin/kurbanliklar/data/tasks.json"
//     )
//   );

//   const tasks = JSON.parse(data.toString());

//   return z.array(sacrificeSchema).parse(tasks);
// }

// export const metadata: Metadata = {
//   title: "Tasks",
//   description: "A task and issue tracker build using Tanstack Table.",
// };


const Page = () => {
  // const tasks = await getTasks();

  const [data, setData] = useState<sacrificeSchema[]>([]);

  useEffect(() => {
    // Güvenlik Riski: Admin yetkisi kontrolü yok
    const fetchData = async () => {
      const { data: initialData, subscription } = await fetchTableData(
        "sacrifice_animals",
        { column: 'sacrifice_no', ascending: true },
        (payload: {
          eventType: string;
          new: sacrificeSchema;
          old: sacrificeSchema;
        }) => {
          console.log("Realtime data:", payload);

          // Gelen real-time olay türüne göre state'i güncelle
          if (payload.eventType === "INSERT") {
            setData((prevData) => [...prevData, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setData((prevData) =>
              prevData.map((item) =>
                item.sacrifice_no === payload.new.sacrifice_no
                  ? payload.new
                  : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            setData((prevData) =>
              prevData.filter(
                (item) => item.sacrifice_no !== payload.old.sacrifice_no
              )
            );
          }
        }
      );

      // İlk çekilen veriyi state'e ekle
      setData(initialData);

      // Cleanup: Aboneliği kaldır
      return () => {
        subscription.unsubscribe();
      };
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="flex flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between">
          
          {/* Header */}
          {/* <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Kurbanlıklar Tablosu
            </h2>
            <p className="text-muted-foreground">
              Aşağıda tüm kurbanlıklara dair bilgileri görebilir,
              düzenleyebilir, silebilir veya ekleyebilirsiniz.
            </p>
          </div> */}
        </div>
        <DataTable data={data} columns={columns} />
      </div>
    </>
  );
};

export default Page;
