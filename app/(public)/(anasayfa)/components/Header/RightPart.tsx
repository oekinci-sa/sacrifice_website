import { Button } from '@/components/ui/button'
import Link from 'next/link';
import React from 'react'
import { ModeToggle } from './ModeToggle';

const RightPart = () => {
  return (
    <div className="flex justify-end w-full gap-4">
      {/* <i className="bi bi-brightness-high"></i> */}
      <ModeToggle></ModeToggle>
      <Button>Hemen al</Button>
    </div>
  );
}

export default RightPart