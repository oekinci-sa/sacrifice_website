"use client";

import { ShareholderLookup } from "@/components/common/shareholder-lookup";

export default function HisseSorgula() {
  return (
    <div className="container">
      <div className="flex flex-col items-center min-h-[30vh] md:min-h-[40vh] py-8">
        <div className="w-full max-w-6xl">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl font-semibold">Hisse Sorgula</h1>
            <p className="text-muted-foreground">
              Telefon numaranızı girerek hisse bilgilerinizi sorgulayabilirsiniz.
            </p>
          </div>

          <ShareholderLookup />
        </div>
      </div>
    </div>
  );
}
