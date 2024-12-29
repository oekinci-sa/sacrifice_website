import { promises as fs } from "fs";
import path from "path";
import { Metadata } from "next";
import Image from "next/image";
import { z } from "zod";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { UserNav } from "./components/user-nav";
import { sacrificeSchema } from "./data/schema";

export const metadata: Metadata = {
  title: "Tasks",
  description: "A task and issue tracker build using Tanstack Table.",
};

// Simulate a database read for tasks.
async function getTasks() {
  const data = await fs.readFile(
    path.join(
      process.cwd(),
      "app/(admin)/kurban-admin/kurbanliklar/data/tasks.json"
    )
  );

  const tasks = JSON.parse(data.toString());

  return z.array(sacrificeSchema).parse(tasks);
}

const page = async () => {
  const tasks = await getTasks();

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Kurbanlıklar Tablosu
            </h2>
            <p className="text-muted-foreground">
              Aşağıda tüm kurbanlıklara dair bilgileri görebilir,
              düzenleyebilir, silebilir veya ekleyebilirsiniz.
            </p>
          </div>
        </div>
        <DataTable data={tasks} columns={columns} />
      </div>
    </>
  );
};

export default page;
