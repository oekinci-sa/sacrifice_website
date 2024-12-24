import { Button } from '@/components/ui/button'
import { Sun } from 'lucide-react';
import Link from 'next/link';
import React from 'react'

const LeftPart = () => {
  return (
    <div className='flex items-center space-x-4'>
      <Sun />
      <Button>
        <Link href="/iletisim">Bize Ulaşın!</Link>
      </Button>
    </div>
  );
}

export default LeftPart