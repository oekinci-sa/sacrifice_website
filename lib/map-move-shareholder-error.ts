/**
 * rpc_move_shareholder_to_sacrifice Postgres exception metinlerini kullanıcı mesajına çevirir.
 */
export function mapMoveShareholderRpcError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("actor_required")) {
    return "Oturum bilgisi eksik.";
  }
  if (m.includes("shareholder_not_found")) {
    return "Hissedar bulunamadı.";
  }
  if (m.includes("sacrifice_row_missing")) {
    return "Kurbanlık kaydı bulunamadı.";
  }
  if (m.includes("source_sacrifice_not_found")) {
    return "Mevcut kurbanlık kaydı bulunamadı.";
  }
  if (m.includes("target_sacrifice_not_found")) {
    return "Hedef kurbanlık bulunamadı.";
  }
  if (m.includes("tenant_mismatch")) {
    return "Kurbanlık bu organizasyona ait değil.";
  }
  if (m.includes("sacrifice_year_mismatch")) {
    return "Hedef kurbanlık farklı bir kurban yılına ait.";
  }
  if (m.includes("target_sacrifice_full")) {
    return "Hedef kurbanlıkta boş hisse yok.";
  }
  if (m.includes("source_empty_share_invariant")) {
    return "Kaynak kurbanlıkta veri tutarsızlığı var; işlem yapılamadı.";
  }
  return "Hissedar taşınamadı.";
}
