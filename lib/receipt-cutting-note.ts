const ELYA_CUTTING_NOTE_LINE_1 = "Lütfen kesim saatinden 45 dk.";
const ELYA_CUTTING_NOTE_LINE_2 = "önce kesim alanında bulununuz.";

export function shouldShowElyaCuttingArrivalNote(
  logoSlug: string | null | undefined,
  deliveryType: string | null | undefined
): boolean {
  return logoSlug === "elya-hayvancilik" && deliveryType !== "Adrese teslim";
}

export function getElyaCuttingArrivalNoteLines(): [string, string] {
  return [ELYA_CUTTING_NOTE_LINE_1, ELYA_CUTTING_NOTE_LINE_2];
}
