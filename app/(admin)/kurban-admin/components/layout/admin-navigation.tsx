import CustomLink from '@/components/common/custom-link';
import React from 'react'

const AdminNavigation = () => {
  return (
    <nav className="flex gap-8 items-center justify-between">
      <CustomLink href="/kurban-admin/genel-bakis">Genel Bakış</CustomLink>
      <CustomLink href="/kurban-admin/kurbanliklar">Kurbanlıklar</CustomLink>
      <CustomLink href="/kurban-admin/hissedarlar">Hissedarlar</CustomLink>
    </nav>
  );
}

export default AdminNavigation