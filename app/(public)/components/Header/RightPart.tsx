import { Button } from '@/components/ui/button'
import Link from 'next/link';
import React from 'react'
import { ModeToggle } from './ModeToggle';

const RightPart = () => {
  return (
    <div className="flex justify-end w-full gap-4">
      {/* <i className="bi bi-brightness-high"></i> */}
      <ModeToggle></ModeToggle>
      <Button size="sm" className="bg-green-500 text-white hover:bg-green-600">
        Hemen al
      </Button>
    </div>
  );
}

export default RightPart