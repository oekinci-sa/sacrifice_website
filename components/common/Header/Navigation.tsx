import React from 'react'
import Link from "next/link";

const Navigation = () => {
  return (
    <div className='flex gap-8'>
      <Link href="/">Anasayfa</Link>
      <Link href="/hakkimizda">Hakkımızda</Link>
      <Link href="/hisseal">Hisse İşlemleri</Link>
      <Link href="/sss">S.S.S</Link>
    </div>
  );
}

export default Navigation