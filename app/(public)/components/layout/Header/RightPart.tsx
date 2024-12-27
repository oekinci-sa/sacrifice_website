import { Button } from '@/components/ui/button'
import Link from 'next/link';
import React from 'react'
import { ModeToggle } from './dark-mode-button';

const RightPart = () => {
  return (
    <div className="flex items-center space-x-4">
      {/* <i className="bi bi-brightness-high"></i> */}
      <ModeToggle></ModeToggle>
      <Button>
        <Link href="/iletisim">Bize Ulaşın!</Link>
      </Button>
    </div>
  );
}

export default RightPart