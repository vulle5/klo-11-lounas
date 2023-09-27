import {
  createMenuItemsForMenuFromHtml,
  findOrCreateMenuForLocation,
} from '@/utils/server/scripts';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const menu = await findOrCreateMenuForLocation(8);

  const result = await createMenuItemsForMenuFromHtml(menu);

  console.log(result?.textContent);

  return new NextResponse('ok');
}
