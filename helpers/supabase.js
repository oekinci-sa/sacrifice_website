import { supabase } from "../utils/supabaseClient";

export const fetchTableData = async (tableName) => {
  const { data, error } = await supabase.from(tableName).select("*");
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const insertData = async (tableName, payload) => {
  const { data, error } = await supabase.from(tableName).insert(payload);
  if (error) {
    throw new Error(error.message);
  }
  return data;
};