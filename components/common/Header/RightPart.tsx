import { Button } from '@/components/ui/button'
import { Sun } from 'lucide-react';
import Link from 'next/link';
import React from 'react'

const RightPart = () => {
  return (
    <div className="flex items-center space-x-4">
      <i className="bi bi-brightness-high"></i>
      <Button>
        <Link href="/iletisim">Bize Ulaşın!</Link>
      </Button>
    </div>
  );
}

export default RightPart