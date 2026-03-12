CREATE OR REPLACE FUNCTION public.title_case_turkish(txt TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  words TEXT[];
  w     TEXT;
  first CHAR;
  rest  TEXT;
  out   TEXT := '';
BEGIN
  words := regexp_split_to_array(txt, '\s+');

  FOREACH w IN ARRAY words LOOP
    first := substring(w,1,1);
    rest  := substring(w FROM 2);

    rest := lower(rest);
    rest := translate(rest, 'Iİ', 'ıi');

    first := translate(first, 'iışğüöç', 'İIŞĞÜÖÇ');
    first := upper(first);

    out := out || first || rest || ' ';
  END LOOP;

  RETURN rtrim(out);
END;
$$;
