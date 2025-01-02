import Link from 'next/link';
import React from 'react'

const AdminNavbar = () => {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-4">
      <Link
        href="/kurban-admin/genel-bakis"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Genel Bakış
      </Link>
      <Link
        href="/kurban-admin/kurbanliklar"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Kurbanlıklar
      </Link>
      <Link
        href="/kurban-admin/hissedarlar"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Hissedarlar
      </Link>
    </header>
  );
}

export default AdminNavbar