import { getMenus } from '@/utils/data/menus';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const menus = await getMenus({ date: new Date() });

  return NextResponse.json(menus);
}
