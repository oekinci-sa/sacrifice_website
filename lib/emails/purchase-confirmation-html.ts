/** Hisse tamamlandıktan sonra otomatik gönderilen teşekkür e-postası (HTML). */

export function buildPurchaseConfirmationHtml(params: {
  tenantName: string;
  shareholderName: string;
  sacrificeNo: string;
  securityCode: string;
}): { html: string; text: string } {
  const { tenantName, shareholderName, sacrificeNo, securityCode } = params;
  const safeName = escapeHtml(shareholderName);
  const safeTenant = escapeHtml(tenantName);
  const safeNo = escapeHtml(sacrificeNo);
  const safeCode = escapeHtml(securityCode);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>Merhaba ${safeName},</p>
  <p>Hisse kaydınız başarıyla tamamlanmıştır. ${safeTenant} olarak teşekkür ederiz.</p>
  <p><strong>Kurban no:</strong> ${safeNo}<br />
  <strong>Güvenlik kodu:</strong> ${safeCode}</p>
  <p>Teşekkür sayfasındaki <strong>PDF İndir</strong> ile hissedar bilgi dökümanınıza ulaşabilirsiniz. Hisse sorgulama için sitemizdeki <strong>Hisse Sorgula</strong> bölümünü kullanabilirsiniz.</p>
  <p style="color:#666;font-size:14px;">Bu e-posta otomatik gönderilmiştir.</p>
</body>
</html>`.trim();

  const text = [
    `Merhaba ${shareholderName},`,
    "",
    `Hisse kaydınız başarıyla tamamlanmıştır. ${tenantName} olarak teşekkür ederiz.`,
    "",
    `Kurban no: ${sacrificeNo}`,
    `Güvenlik kodu: ${securityCode}`,
    "",
    "Teşekkür sayfasındaki PDF İndir ile hissedar bilgi dökümanınıza ulaşabilirsiniz.",
    "",
    "Bu e-posta otomatik gönderilmiştir.",
  ].join("\n");

  return { html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
