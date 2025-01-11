import { supabase } from "../utils/supabaseClient";

export const fetchTableData = async (tableName, orderBy, callback) => {
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .order(orderBy.column, { ascending: orderBy.ascending });
  if (error) {
    throw new Error(error.message);
  }

  // Set up real-time subscription (supabase-js v2)
  const subscription = supabase
    .channel(`realtime:${tableName}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: tableName },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return { data, subscription };
};

export const insertData = async (tableName, payload) => {
  const { data, error } = await supabase.from(tableName).insert(payload);
  if (error) {
    throw new Error(error.message);
  }
  return data;
};