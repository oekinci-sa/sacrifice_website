import React from 'react'
import Link from "next/link";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@radix-ui/react-navigation-menu';
import { navigationItems } from '@/constants/';
import { Button } from '@/components/ui/button';
import { MoveRight } from 'lucide-react';

const Navigation = () => {
  return (
    <div className="justify-start items-center gap-4 lg:flex hidden flex-row">
      <NavigationMenu className="flex justify-start items-start">
        <NavigationMenuList className="flex justify-start gap-4 flex-row">
          {navigationItems.map((item) => (
            <NavigationMenuItem key={item.title}>
              {item.href ? (
                <>
                  <NavigationMenuLink>
                    <Button variant="ghost">{item.title}</Button>
                  </NavigationMenuLink>
                </>
              ) : (
                <>
                  <NavigationMenuTrigger className="font-medium text-sm">
                    {item.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="!w-[450px] p-4">
                    <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex flex-col">
                          <p className="text-base">{item.title}</p>
                          <p className="text-muted-foreground text-sm">
                            {item.description}
                          </p>
                        </div>
                        <Button size="sm" className="mt-10">
                          Book a call today
                        </Button>
                      </div>
                      <div className="flex flex-col text-sm h-full justify-end">
                        {item.items?.map((subItem) => (
                          <NavigationMenuLink
                            href={subItem.href}
                            key={subItem.title}
                            className="flex flex-row justify-between items-center hover:bg-muted py-2 px-4 rounded"
                          >
                            <span>{subItem.title}</span>
                            <MoveRight className="w-4 h-4 text-muted-foreground" />
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </>
              )}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

export default Navigation